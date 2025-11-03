import React from 'react';
import type { Product } from '../types';
import { StoreIcon, OnlineIcon, LinkIcon } from './IconComponents';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-[#1F2937]/70 p-4 rounded-lg border border-[var(--border-color)] transition-all duration-300 hover:shadow-lg hover:border-[#EC4899]/50 hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div>
          <h5 className="font-bold text-[#E5E7EB]">{product.itemName}</h5>
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF] mt-1">
            {product.storeType === 'local' ? <StoreIcon /> : <OnlineIcon />}
            <span>{product.storeName}</span>
          </div>
        </div>
        {product.price && <span className="text-lg font-semibold text-[#EC4899]">{product.price}</span>}
      </div>
      <div className="mt-3 text-right">
        <a 
          href={product.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-2 text-sm font-medium text-[#8B5CF6] hover:text-white transition-colors"
        >
          <LinkIcon />
          <span>Shop Now</span>
        </a>
      </div>
    </div>
  );
};