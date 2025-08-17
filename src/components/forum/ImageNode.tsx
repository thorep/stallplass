import React from 'react';
import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  createCommand,
  LexicalCommand,
  SerializedLexicalNode
} from 'lexical';

export interface ImagePayload {
  src: string;
  altText: string;
  maxWidth?: number;
  key?: NodeKey;
}

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand();

export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string;
  __altText: string;
  __maxWidth?: number;

  static getType(): string {
    return 'image';
  }

  constructor(src: string, altText: string, maxWidth?: number, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedLexicalNode & { src: string; altText: string; maxWidth?: number }): ImageNode {
    const { src, altText, maxWidth } = serializedNode;
    return $createImageNode({ src, altText, maxWidth });
  }

  exportJSON() {
    return {
      src: this.__src,
      altText: this.__altText,
      maxWidth: this.__maxWidth,
      type: 'image',
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    img.style.maxWidth = this.__maxWidth ? `${this.__maxWidth}px` : '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '1rem 0';
    img.style.borderRadius = '8px';
    return img;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          maxWidth: this.__maxWidth ? `${this.__maxWidth}px` : '100%',
          height: 'auto',
          display: 'block',
          margin: '1rem 0',
          borderRadius: '8px'
        }}
      />
    );
  }
}

export function $createImageNode({ src, altText, maxWidth }: ImagePayload): ImageNode {
  return new ImageNode(src, altText, maxWidth);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}