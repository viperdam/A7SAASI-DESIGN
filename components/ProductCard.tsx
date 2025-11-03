import React from 'react';
import type { Product } from '../types';
import { StoreIcon, OnlineIcon, LinkIcon } from './IconComponents';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 transition-shadow hover:shadow-lg hover:border-pink-500/50">
      <div className="flex justify-between items-start">
        <div>
          <h5 className="font-bold text-gray-100">{product.itemName}</h5>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            {product.storeType === 'local' ? <StoreIcon /> : <OnlineIcon />}
            <span>{product.storeName}</span>
          </div>
        </div>
        {product.price && <span className="text-lg font-semibold text-pink-400">{product.price}</span>}
      </div>
      <div className="mt-3 text-right">
        <a 
          href={product.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          <LinkIcon />
          <span>Shop Now</span>
        </a>
      </div>
    </div>
  );
};
