export type CategoryType = 'Expense' | 'Income';

export interface Category {
  id: number;
  name: string;
  isFixed: boolean;
  type: CategoryType;
  parentId: number | null;
  parentName?: string | null;
  children?: Category[];
}

export interface CategoryCreate {
  name: string;
  isFixed: boolean;
  type: CategoryType;
  parentId: number | null;
}
