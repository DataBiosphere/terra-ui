const visitNode = (context, node) => {
  if (node.source && node.source.value.includes('/') && !node.source.value.endsWith('.js')) {
    context.report({
      node,
      message: 'Import missing JS extension: {{request}}.',
      data: {
        request: node.source.value,
      },
      fix(fixer) {
        return fixer.insertTextAfterRange([node.source.range[0], node.source.range[1] - 1], '.js');
      },
    });
  }
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce that imports are fully-specified.',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        visitNode(context, node);
      },
      ImportDeclaration(node) {
        visitNode(context, node);
      },
    };
  },
};
