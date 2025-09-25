
"use client";

import { icons, Utensils } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const FoodIcon = ({ iconName, ...props }: { iconName?: string } & LucideProps) => {
  const Icon = iconName ? (icons as any)[iconName] : Utensils;
  
  if (!Icon) {
    return <Utensils {...props} />;
  }

  return <Icon {...props} />;
};

export default FoodIcon;
