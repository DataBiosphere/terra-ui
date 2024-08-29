import { h } from 'react-hyperscript-helpers';
import { RightBoxSection, RightBoxSectionProps } from 'src/components/RightBoxSection';

export const WorkflowRightBoxSection = (props: RightBoxSectionProps) => {
  const { title, persistenceId, afterTitle, info, children } = props;

  return h(
    RightBoxSection,
    {
      title,
      persistenceId,
      afterTitle,
      info,
    },
    [children]
  );
};
