import * as clipboard from 'clipboard-polyfill/text';
import debounce from 'lodash/debounce';
import _ from 'lodash/fp';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonOutline, Link } from 'src/components/common';
import { getUserProjectForWorkspace, parseGsUri } from 'src/components/data/data-utils';
import { centeredSpinner, icon } from 'src/components/icons';
import IGVAddTrackModal from 'src/components/igv/IGVAddTrackModal';
import { GoogleStorage, saToken } from 'src/libs/ajax/GoogleStorage';
import colors from 'src/libs/colors';
import { reportError, withErrorReporting } from 'src/libs/error';
import { isGoogleStorageURL, isGoogleURL, translateGoogleCloudURL } from 'src/libs/igv-google-utils';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { knownBucketRequesterPaysStatuses, requesterPaysProjectStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { RequesterPaysModal } from 'src/workspaces/common/requester-pays/RequesterPaysModal';

import { buildFilter } from './IGVFilter';
import IGVSessionModal from './IGVSessionModal';
import { updateUrlWithSession, useIGVSessions } from './useIGVSessions';

function getHasVariantFiles(files) {
  return files.some((file) => file.filePath.includes('.vcf'));
}

function processUrl(url, isSignedUrl) {
  if (url && isGoogleURL(url) && isGoogleStorageURL(url) && isSignedUrl) {
    return translateGoogleCloudURL(url);
  }
  return url;
}

// format for selectedFiles prop: [{ filePath, indexFilePath, isSignedUrl } }]
const IGVBrowser = ({ selectedFiles, refGenome: { genome, reference }, workspace, onDismiss, initialSession, onFilterPanelChange }) => {
  const [loadingIgv, setLoadingIgv] = useState(true);
  const [requesterPaysModal, setRequesterPaysModal] = useState(null);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionAction, setSessionAction] = useState(null); // 'save' or 'load'
  const [sharingSession, setSharingSession] = useState(false);
  const [filterPanelData, setFilterPanelData] = useState(null);
  const currentFilterFunction = useRef(null);
  const [tracksLoaded, setTracksLoaded] = useState(false);
  const filterPanelDataRef = useRef(null); // Track current panel data

  useEffect(() => {
    filterPanelDataRef.current = filterPanelData;
  }, [filterPanelData]);

  const findVariantTrack = useCallback(() => {
    if (!igvBrowser.current) return null;

    for (const trackView of igvBrowser.current.trackViews) {
      const track = trackView.track;

      if (track.type === 'variant' || track.format === 'vcf' || track.format === 'VCF' || track?.url?.toLowerCase().includes('.vcf')) {
        return track;
      }
    }

    return null;
  }, []);

  // When the user changes a filter, update the filter function on the variant track and refresh the view
  const handleFilterChange = useCallback(
    (selections, facets) => {
      if (!igvBrowser.current) return;

      const filterFunction = buildFilter(selections, facets);
      currentFilterFunction.current = filterFunction;

      const trackToFilter = findVariantTrack();

      if (trackToFilter) {
        trackToFilter.filter = filterFunction;

        // Try to refresh the track view
        const trackView = igvBrowser.current.trackViews.find((tv) => tv.track === trackToFilter);
        if (trackView) {
          trackView.repaintViews();
        }
      } else {
        console.error('No variant track found for filtering');
      }
    },
    [findVariantTrack]
  );

  // When the locus changes, either by moving to a different chromosome or zooming in,
  // update the filter panel with the new features in view
  // This triggers reinitialization of the filter panel with the new features
  const debouncedHandleLocusChange = useRef(
    debounce(() => {
      const currentPanelData = filterPanelDataRef.current;

      if (currentPanelData?.show) {
        const trackToFilter = findVariantTrack();

        if (trackToFilter && onFilterPanelChange) {
          onFilterPanelChange({
            ...currentPanelData,
            isLoading: true,
          });

          let attempts = 0;
          const maxAttempts = 20;

          const checkFeaturesLoaded = () => {
            const features = trackToFilter.getInViewFeatures();
            attempts++;

            if (features.length > 0 || attempts >= maxAttempts) {
              const updatedPanelData = {
                ...currentPanelData,
                trackToFilter,
                isInitialized: false,
                currentFacets: [],
                currentSelections: {},
                isLoading: false,
              };

              setFilterPanelData(updatedPanelData);
              onFilterPanelChange(updatedPanelData);
            } else {
              setTimeout(checkFeaturesLoaded, 100);
            }
          };

          setTimeout(checkFeaturesLoaded, 100);
        }
      }
    }, 500) // Wait 500ms after the last locus change
  ).current;

  const handleLocusChange = useCallback(() => {
    debouncedHandleLocusChange();
  }, [debouncedHandleLocusChange]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedHandleLocusChange.cancel();
    };
  }, [debouncedHandleLocusChange]);

  // When the filter panel is opened or closed, notify the parent component to remove/add it from the screen
  // When closing, save the data in state so we can reuse it if reopening
  const toggleFilterPanel = useCallback(
    (show) => {
      if (!onFilterPanelChange) return;

      if (show) {
        if (!igvBrowser.current) return;

        const trackToFilter = findVariantTrack();
        if (!trackToFilter) return;

        const currentPanelData = filterPanelDataRef.current;

        // If we already have filter panel data (reopening), reuse it
        if (currentPanelData && !currentPanelData.show) {
          const updatedPanelData = {
            ...currentPanelData,
            show: true,
            trackToFilter,
          };
          setFilterPanelData(updatedPanelData);
          onFilterPanelChange(updatedPanelData);
          return;
        }

        // First time opening - create new panel data
        const panelData = {
          show: true,
          trackToFilter,
          onFilterChange: handleFilterChange,
          onFacetsUpdate: (facets, selections) => {
            setFilterPanelData((prev) => ({
              ...prev,
              currentFacets: facets,
              currentSelections: selections,
            }));
          },
          onClose: () => toggleFilterPanel(false),
          currentSelections: {},
          currentFacets: [],
          isInitialized: false,
          setIsInitialized: (value) => {
            setFilterPanelData((prev) => (prev ? { ...prev, isInitialized: value } : null));
          },
          isLoading: false,
        };

        setFilterPanelData(panelData);
        onFilterPanelChange(panelData);
      } else {
        // Closing - keep filterPanelData in state, just hide the panel
        const currentPanelData = filterPanelDataRef.current;
        if (currentPanelData) {
          const hiddenPanelData = {
            ...currentPanelData,
            show: false,
          };
          setFilterPanelData(hiddenPanelData);
        }
        onFilterPanelChange({ show: false });
      }
    },
    [handleFilterChange, onFilterPanelChange, findVariantTrack]
  );

  const handleDismiss = useCallback(() => {
    setFilterPanelData(null); // Clear all filter state when IGV closes
    onDismiss();
  }, [onDismiss]);

  const containerRef = useRef();
  const igvLibrary = useRef();
  const igvBrowser = useRef();
  const signal = useCancellation();

  const hasVariantFiles = getHasVariantFiles(selectedFiles);
  const hasSignedUrl = selectedFiles.some((file) => file.isSignedUrl);

  const {
    savedSessions,
    loadSession: loadSessionData,
    saveSession: saveSessionData,
    deleteSession,
  } = useIGVSessions(workspace?.workspace?.workspaceId);

  const addTracks = withErrorReporting('Unable to add tracks')(async (tracks) => {
    const gsTracks = tracks.filter((track) => track.isSignedUrl === false);

    // Select one file per each bucket represented in the tracks list.
    const bucketExemplars = _.flow(
      _.map(_.get('url')),
      _.uniqBy((url) => {
        const [bucket] = parseGsUri(url);
        return bucket;
      })
    )(gsTracks);

    // Learn the requester pays status of each bucket.
    // Requesting a file will store its requester pays status in knownBucketRequesterPaysStatuses.
    const isRequesterPays = await Promise.all(
      _.map(async (url) => {
        const [bucket, file] = parseGsUri(url);

        if (knownBucketRequesterPaysStatuses.get()[bucket] === undefined) {
          try {
            await GoogleStorage(signal).getObject(workspace.workspace.googleProject, bucket, file, { fields: 'kind' });
          } catch (e) {
            if (!e.requesterPaysError) {
              throw e;
            }
          }
        }
        return knownBucketRequesterPaysStatuses.get()[bucket];
      }, bucketExemplars)
    );

    // If any bucket is requester pays, files in that bucket will need to have a user project included in the request.
    let userProject;
    if (_.some(_.identity, isRequesterPays)) {
      // Check if the user can bill to the current workspace.
      userProject = await getUserProjectForWorkspace(workspace);

      // If not, prompt to select a workspace to bill to.
      if (!userProject) {
        userProject = await new Promise((resolve, reject) => {
          setRequesterPaysModal(
            h(RequesterPaysModal, {
              onDismiss: () => {
                setRequesterPaysModal(null);
                reject(new Error('No billing workspace selected.'));
              },
              onSuccess: (selectedGoogleProject) => {
                setRequesterPaysModal(null);
                requesterPaysProjectStore.set(selectedGoogleProject);
                resolve(selectedGoogleProject);
              },
            })
          );
        });
      }
    }

    const loadTrackPromises = tracks.map(({ name, url, indexURL, isSignedUrl }) => {
      const [bucket] = parseGsUri(url);
      const userProjectParam = { userProject: knownBucketRequesterPaysStatuses.get()[bucket] ? userProject : undefined };

      // Omit residual URL parameters from access URLs resolved via DRS Hub
      const simpleUrl = url.split('/').at(-1).split('?')[0];

      const fullUrl = isSignedUrl ? url : Utils.mergeQueryParams(userProjectParam, url);
      const fullIndexUrl = isSignedUrl ? indexURL : indexURL && Utils.mergeQueryParams(userProjectParam, indexURL);

      // Enable viewing variants for a handful of genes (or a few CNVs), simultaneously;
      // or enable viewing other features (e.g. reads) for almost any gene, without zoom
      const isVcf = getHasVariantFiles([{ filePath: url }]);
      const visibilityWindow = isVcf ? 500_000 : 75_000;

      const igvProcessedFullUrl = processUrl(fullUrl, isSignedUrl);
      const igvProcessedFullIndexUrl = processUrl(fullIndexUrl, isSignedUrl);

      return igvBrowser.current.loadTrack({
        name: name || `${simpleUrl} (${url})`,
        url: igvProcessedFullUrl,
        indexURL: indexURL ? igvProcessedFullIndexUrl : undefined,
        visibilityWindow,
      });
    });

    await Promise.all(loadTrackPromises);
    setTracksLoaded(true);
  });

  const saveSession = async (sessionName) => {
    if (!igvBrowser.current) return false;

    try {
      const session = igvBrowser.current.toJSON();
      return await saveSessionData(sessionName, session, genome);
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  };

  const loadSession = async (sessionName) => {
    if (!igvBrowser.current) return false;

    try {
      const sessionData = await loadSessionData(sessionName);
      if (sessionData) {
        await igvBrowser.current.loadSession(sessionData.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load session:', error);
      return false;
    }
  };

  const shareSession = async () => {
    if (!igvBrowser.current) return;

    setSharingSession(true);
    try {
      const session = igvBrowser.current.toJSON();
      const shareUrl = updateUrlWithSession(session, genome);

      if (shareUrl) {
        await clipboard.writeText(shareUrl);
        notify('success', 'Session URL copied to clipboard', { timeout: 3000 });
      } else {
        notify('error', 'Failed to create shareable URL', { timeout: 3000 });
      }
    } catch (error) {
      console.error('Failed to share session:', error);
      notify('error', 'Failed to share session', { timeout: 3000 });
    } finally {
      setSharingSession(false);
    }
  };

  useOnMount(() => {
    const igvSetup = async () => {
      try {
        const { default: igv } = await import('igv');
        igvLibrary.current = igv;

        const options = {
          genome,
          reference,
          tracks: [],
        };

        igv.setGoogleOauthToken(() => saToken(workspace.workspace.googleProject));
        igvBrowser.current = await igv.createBrowser(containerRef.current, options);
        window.igvBrowser = igvBrowser.current;
        // Update the facet widgets on locus change.  Changing the locus changes the features in view.  This can be
        // relatively frequent,  many times a second if dragging the track.
        igvBrowser.current.on('locuschange', handleLocusChange);

        const initialTracks = _.map(({ filePath, indexFilePath, isSignedUrl }) => {
          return { url: filePath, indexURL: indexFilePath, isSignedUrl };
        }, selectedFiles);
        addTracks(initialTracks);

        // Load initial session if provided
        if (initialSession) {
          await igvBrowser.current.loadSession(initialSession);
        }
      } catch (e) {
        reportError('Error loading IGV.js', e);
      } finally {
        setLoadingIgv(false);
      }
    };

    igvSetup();

    return () => {
      if (igvLibrary.current) {
        // Remove event listeners before cleanup
        igvLibrary.current.removeAllBrowsers();
      }
    };
  });

  return h(Fragment, [
    div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.5rem 0' } }, [
      h(
        Link,
        {
          onClick: () => {
            handleDismiss();
          },
        },
        [icon('arrowLeft', { style: { marginRight: '1ch' } }), 'Back to data table']
      ),
      div({ style: { display: 'flex', gap: '0.5rem' } }, [
        h(
          ButtonOutline,
          {
            disabled: loadingIgv || hasSignedUrl,
            tooltip: hasSignedUrl ? 'Cannot save session with signed URLs' : undefined,
            onClick: () => {
              setSessionAction('save');
              setShowSessionModal(true);
            },
          },
          ['Save Session']
        ),
        h(
          ButtonOutline,
          {
            disabled: loadingIgv,
            onClick: () => {
              setSessionAction('load');
              setShowSessionModal(true);
            },
          },
          ['Load Session']
        ),
        h(
          ButtonOutline,
          {
            disabled: loadingIgv || sharingSession || hasSignedUrl,
            tooltip: hasSignedUrl ? 'Cannot share session with signed URLs' : undefined,
            onClick: shareSession,
          },
          [sharingSession ? 'Sharing...' : 'Share Session']
        ),
        h(
          ButtonOutline,
          {
            disabled: loadingIgv,
            onClick: () => setShowAddTrackModal(true),
          },
          ['Add track']
        ),
        hasVariantFiles
          ? h(
              ButtonOutline,
              {
                disabled: loadingIgv || !tracksLoaded,
                onClick: () => {
                  toggleFilterPanel(true);
                },
                style: { marginRight: '5px' },
              },
              ['Filter variants']
            )
          : null,
      ]),
    ]),
    div(
      {
        ref: containerRef,
        style: {
          overflowY: 'visible',
          padding: '10px 0',
          margin: 8,
          border: `1px solid ${colors.dark(0.25)}`,
        },
      },
      [loadingIgv && centeredSpinner()]
    ),
    requesterPaysModal,
    showAddTrackModal &&
      h(IGVAddTrackModal, {
        onDismiss: () => setShowAddTrackModal(false),
        onSubmitTrack: (track) => {
          setShowAddTrackModal(false);
          addTracks([track]);
        },
      }),
    showSessionModal &&
      h(IGVSessionModal, {
        action: sessionAction,
        savedSessions,
        onDismiss: () => setShowSessionModal(false),
        onSave: async (name) => {
          const success = await saveSession(name);
          if (success) {
            setShowSessionModal(false);
          }
          return success;
        },
        onLoad: async (name) => {
          const success = await loadSession(name);
          if (success) {
            setShowSessionModal(false);
          }
          return success;
        },
        onDelete: async (name) => {
          return deleteSession(name); // This will update savedSessions automatically
        },
      }),
  ]);
};

export default IGVBrowser;
