import { h } from 'react-hyperscript-helpers';
import { RightBoxSection, RightBoxSectionProps } from 'src/components/RightBoxSection';
import { useLocalPref } from 'src/libs/useLocalPref';

export const WorkflowRightBoxSection = (props: RightBoxSectionProps) => {
  const { title, persistenceId, defaultPanelOpen, afterTitle, info, children } = props;
  const [panelOpen, setPanelOpen] = useLocalPref<boolean>(persistenceId, defaultPanelOpen);

  return h(
    RightBoxSection,
    {
      panelOpen,
      setPanelOpen,
      title,
      persistenceId,
      afterTitle,
      info,
    },
    [children]
  );
};
