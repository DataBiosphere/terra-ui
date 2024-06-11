import React, { ReactNode } from 'react';
import { Link } from 'src/components/common';
import * as Utils from 'src/libs/utils';

export interface SaveFilesHelpProps {
  isGalaxyDisk?: boolean;
}
export const SaveFilesHelp = (props: SaveFilesHelpProps): ReactNode => {
  const { isGalaxyDisk = false } = props;
  return (
    <p>
      If you want to save some files permanently, such as input data, analysis outputs, or installed packages,&nbsp;
      <Link
        aria-label='Save file help'
        href='https://support.terra.bio/hc/en-us/articles/360026639112'
        {...Utils.newTabLinkProps}
      >
        move them to the workspace bucket.
      </Link>
      {!isGalaxyDisk
        ? ' Note: Jupyter notebooks are autosaved to the workspace bucket, and deleting your disk will not delete your notebooks.'
        : ''}
    </p>
  );
};

export const SaveFilesHelpRStudio = (): ReactNode => {
  return (
    <p>
      If you want to save files permanently, including input data, analysis outputs, installed packages or code in your
      session,&nbsp;
      <Link
        aria-label='RStudio save help'
        href='https://support.terra.bio/hc/en-us/articles/360026639112'
        {...Utils.newTabLinkProps}
      >
        move them to the workspace bucket.
      </Link>
    </p>
  );
};

export const SaveFilesHelpGalaxy = (): ReactNode => {
  return (
    <>
      <p>
        Deleting your Cloud Environment will stop your running Galaxy application and your application costs. You can
        create a new Cloud Environment for Galaxy later, which will take 8-10 minutes.
      </p>
      <p>
        If you want to save some files permanently, such as input data, analysis outputs, or installed packages,&nbsp;
        <Link
          aria-label='Galaxy save help'
          href='https://support.terra.bio/hc/en-us/articles/360026639112'
          {...Utils.newTabLinkProps}
        >
          move them to the workspace bucket.
        </Link>
      </p>
    </>
  );
};

export const SaveFilesHelpAzure = (): ReactNode => {
  return (
    <p>
      If you want to save some files permanently, such as input data, analysis outputs, or installed packages,&nbsp;
      <Link
        aria-label='Save file help'
        href='https://support.terra.bio/hc/en-us/articles/12043575737883'
        {...Utils.newTabLinkProps}
      >
        move them to the workspace bucket.
      </Link>
    </p>
  );
};

export const GalaxyWarning = (): ReactNode => {
  return (
    <>
      <p style={{ fontWeight: 600 }}>Important: Please keep this tab open and logged in to Terra while using Galaxy.</p>
      <p>Galaxy will open in a new tab.</p>
    </>
  );
};

export const appLauncherTabName = 'workspace-application-launch';
export const appLauncherWithAnalysisTabName = `${appLauncherTabName}-with-analysis`;
export const analysisLauncherTabName = 'workspace-analysis-launch';
export const analysisTabName = 'workspace-analyses';
