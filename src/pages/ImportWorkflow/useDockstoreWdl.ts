import { useEffect } from 'react';
import { Dockstore, DockstoreWorkflowVersionDescriptor } from 'src/libs/ajax/Dockstore';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import { reportError } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';

export const useDockstoreWdl = (workflow: DockstoreWorkflowVersionDescriptor) => {
  const { path, version, isTool } = workflow;

  const [wdlData, loadWdlData] = useLoadedData<string>({
    onError: (err) => reportError('Error loading WDL', err),
  });

  const signal = useCancellation();
  useEffect(
    () => {
      loadWdlData(() => Dockstore(signal).getWdl({ path, version, isTool }));
    },
    // loadWdlData changes on each render, so cannot depend on it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path, version, isTool]
  );

  if (wdlData.status !== 'None') {
    const { state: wdl, ...rest } = wdlData;
    return { ...rest, wdl };
  }
  return wdlData;
};
