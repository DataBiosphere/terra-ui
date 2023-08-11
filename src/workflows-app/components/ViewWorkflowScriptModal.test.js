import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import ViewWorkflowScriptModal from 'src/workflows-app/components/ViewWorkflowScriptModal';

describe('ViewWorkflowScriptModal', () => {
  it('should render workflow details', () => {
    // ** ARRANGE **
    const helloWdlScript = `
    workflow myWorkflow {
      call myTask
    }

    task myTask {
      runtime {
        docker: "ubuntu:latest"
      }
      command {
        echo "hello world"
      }
      output {
        String out = read_string(stdout())
      }
    }`;

    // ** ACT **
    render(h(ViewWorkflowScriptModal, { workflowScript: helloWdlScript, onDismiss: jest.fn() }));

    // ** ASSERT **
    expect(screen.getByText('Workflow Script')).toBeInTheDocument();
    expect(screen.getByRole('code')).toBeInTheDocument();

    // WdlViewer has different class for each type of element in the WDL (keyword, punctuation, string, operator, etc.).
    // As a result it is not possible to search for entire strings like "task myTask" even though they appear on same line when rendered.
    // React testing library also doesn't provide an easy way to get elements by class. Hence, instead we check that unique text does indeed render on screen as expected
    expect(screen.getByText('task')).toBeInTheDocument();
    expect(screen.getByText('workflow')).toBeInTheDocument();
    expect(screen.getByText('command')).toBeInTheDocument();
    expect(screen.getByText('"hello world"')).toBeInTheDocument();
    expect(screen.getByText('myWorkflow')).toBeInTheDocument();
    expect(screen.getByText('"ubuntu:latest"')).toBeInTheDocument();
  });
});
