import _ from 'lodash/fp';
import React from 'react';
import { ACTION_BAR_HEIGHT, ActionBar } from 'src/components/ActionBar';
import { SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';

interface ConceptCartProps {
  cart: Concept[];
  onCommit: (selected: Concept[]) => void;
  actionText: string;
}

export const ConceptCart = (props: ConceptCartProps) => {
  const { cart, onCommit, actionText } = props;

  return (
    cart.length !== 0 && (
      <>
        <div style={{ width: '100%', height: ACTION_BAR_HEIGHT }} />
        <ActionBar
          prompt={cart.length === 1 ? '1 concept selected' : `${cart.length} concepts selected`}
          actionText={actionText}
          onClick={() => _.flow(onCommit)(cart)}
        />
      </>
    )
  );
};
