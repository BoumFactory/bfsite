import React from 'react';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

interface CustomTreeItemProps {
  node: {
    type: 'directory' | 'file';
    name: string;
    path?: string; // Peut être optionnel
    children?: any[];
  };
  onDoubleClick: (node: any) => void;
  parentId?: string; // Pour générer un id stable
  index?: number;    // Pour générer un id stable
}

export default function CustomTreeItem({
  node,
  onDoubleClick,
  parentId = '',
  index = 0,
}: CustomTreeItemProps) {
  const handleDoubleClick = (event: React.MouseEvent) => {
    if (node.type === 'file') {
      onDoubleClick(node);
      event.stopPropagation();
    }
  };

  // Utilise node.path si défini, sinon génère un id stable
  const itemId = node.path || `${parentId}${node.name}-${index}`;

  return (
    <TreeItem itemId={itemId} label={node.name} onDoubleClick={handleDoubleClick}>
      {node.children &&
        node.children.map((child: any, i: number) => (
          <CustomTreeItem
            key={child.path || `${itemId}-${child.name}-${i}`}
            node={child}
            onDoubleClick={onDoubleClick}
            parentId={itemId + '-'}
            index={i}
          />
        ))}
    </TreeItem>
  );
}
