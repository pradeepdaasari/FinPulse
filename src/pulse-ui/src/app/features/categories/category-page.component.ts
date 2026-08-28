import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService } from '../../core/services/category.service';
import { Category, CategoryCreate, CategoryType } from '../../core/models/category.model';

const ICON_OPTIONS = [
  'home', 'apartment', 'house', 'directions_car', 'local_gas_station', 'local_parking',
  'build', 'hail', 'car_rental', 'car_crash', 'shield', 'health_and_safety', 'security',
  'bolt', 'electrical_services', 'water_drop', 'gas_meter', 'phone_android', 'wifi',
  'subscriptions', 'live_tv', 'headphones', 'cloud', 'fitness_center', 'apps',
  'restaurant', 'dinner_dining', 'coffee', 'delivery_dining', 'shopping_cart',
  'celebration', 'movie', 'shopping_bag', 'flight', 'palette', 'redeem',
  'favorite', 'local_hospital', 'spa', 'checkroom', 'school', 'pets',
  'savings', 'emergency', 'elderly', 'trending_up', 'percent', 'pie_chart',
  'work', 'payments', 'card_giftcard', 'schedule', 'monetization_on',
  'laptop', 'handyman', 'storefront', 'account_balance', 'real_estate_agent',
  'category', 'label', 'receipt', 'attach_money', 'toll', 'local_offer'
];

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatExpansionModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule,
    MatSnackBarModule, MatTooltipModule, MatChipsModule, MatTabsModule, MatButtonToggleModule,
    MatMenuModule, MatProgressSpinnerModule
  ],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
    <div class="page-header">
      <button mat-raised-button color="primary" (click)="showAddParent.set(true)" [disabled]="showAddParent()">
        <mat-icon>add</mat-icon> Add Category
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="stats-row">
      <div class="stat-card stat-blue">
        <mat-icon>category</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ allCategories().length }}</span>
          <span class="stat-label">Total Categories</span>
        </div>
      </div>
      <div class="stat-card stat-amber">
        <mat-icon>receipt_long</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ expenseCategories().length }}</span>
          <span class="stat-label">Expense</span>
        </div>
      </div>
      <div class="stat-card stat-green">
        <mat-icon>trending_up</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ incomeCategories().length }}</span>
          <span class="stat-label">Income</span>
        </div>
      </div>
      <div class="stat-card stat-purple">
        <mat-icon>lock</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ fixedCount() }}</span>
          <span class="stat-label">Fixed</span>
        </div>
      </div>
    </div>

    @if (showAddParent()) {
      <mat-card class="add-form-card">
        <mat-card-content>
          <div class="inline-form">
            <button mat-icon-button [matMenuTriggerFor]="newParentIconMenu" class="icon-picker-btn" matTooltip="Pick icon">
              <mat-icon>{{ newParentIcon || 'category' }}</mat-icon>
            </button>
            <mat-menu #newParentIconMenu="matMenu" class="icon-menu">
              <div class="icon-grid" (click)="$event.stopPropagation()">
                @for (icon of iconOptions; track icon) {
                  <button mat-icon-button (click)="newParentIcon = icon" [class.selected]="newParentIcon === icon">
                    <mat-icon>{{ icon }}</mat-icon>
                  </button>
                }
              </div>
            </mat-menu>
            <mat-form-field appearance="outline">
              <mat-label>Category Name</mat-label>
              <input matInput [(ngModel)]="newParentName" (keyup.enter)="saveParent()">
            </mat-form-field>
            <mat-button-toggle-group [(ngModel)]="newParentType" class="type-toggle">
              <mat-button-toggle value="Expense">Expense</mat-button-toggle>
              <mat-button-toggle value="Income">Income</mat-button-toggle>
            </mat-button-toggle-group>
            <mat-slide-toggle [(ngModel)]="newParentFixed">Fixed</mat-slide-toggle>
            <button mat-icon-button color="primary" (click)="saveParent()" [disabled]="!newParentName.trim()" matTooltip="Save">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button (click)="cancelAddParent()" matTooltip="Cancel">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Search categories</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input matInput [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="e.g. Swimming, Insurance...">
      @if (searchQuery()) {
        <button matSuffix mat-icon-button (click)="searchQuery.set('')"><mat-icon>close</mat-icon></button>
      }
    </mat-form-field>

    @if (searchQuery() && searchResults().length > 0) {
      <div class="search-results">
        @for (result of searchResults(); track result.child?.id || result.parent.id) {
          <div class="search-result-row">
            <span class="cat-icon-badge child-badge" [style.background]="getCatBg(result.child?.name || result.parent.name)" [style.border-color]="getCatColor(result.child?.name || result.parent.name)">
              <mat-icon [style.color]="getCatColor(result.child?.name || result.parent.name)">{{ (result.child?.icon || result.parent.icon) || 'category' }}</mat-icon>
            </span>
            <span class="search-result-name">
              @if (result.child) {
                {{ result.parent.name }} → {{ result.child.name }}
              } @else {
                {{ result.parent.name }}
              }
            </span>
            <mat-chip class="search-result-type">{{ result.parent.type }}</mat-chip>
          </div>
        }
      </div>
    } @else if (searchQuery() && searchResults().length === 0) {
      <div class="search-no-results">
        <mat-icon>search_off</mat-icon>
        <span>No categories match "{{ searchQuery() }}"</span>
      </div>
    }

    <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
      <mat-tab label="Expense Categories">
        <div class="tab-content">
          <ng-container *ngTemplateOutlet="categoryList; context: { $implicit: expenseCategories() }"></ng-container>
        </div>
      </mat-tab>
      <mat-tab label="Income Categories">
        <div class="tab-content">
          <ng-container *ngTemplateOutlet="categoryList; context: { $implicit: incomeCategories() }"></ng-container>
        </div>
      </mat-tab>
    </mat-tab-group>

    <ng-template #categoryList let-cats>
      @if (cats.length > 0) {
        <mat-accordion multi>
          @for (parent of cats; track parent.id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <span class="cat-icon-badge parent-badge" [style.background]="getCatBg(parent.name)" [style.border-color]="getCatColor(parent.name)">
                    <mat-icon [style.color]="getCatColor(parent.name)">{{ parent.icon || 'category' }}</mat-icon>
                  </span>
                  @if (editingId() === parent.id) {
                    <input class="inline-edit" [(ngModel)]="editName" (keyup.enter)="saveEdit(parent)" (click)="$event.stopPropagation()">
                  } @else {
                    <span class="cat-label">{{ parent.name }}</span>
                  }
                </mat-panel-title>
                <mat-panel-description>
                  <mat-chip>{{ parent.isFixed ? 'Fixed' : 'Variable' }}</mat-chip>
                  <span class="child-count">{{ parent.children?.length || 0 }} subcategories</span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="panel-actions">
                @if (editingId() === parent.id) {
                  <button mat-icon-button [matMenuTriggerFor]="editIconMenu" class="icon-picker-btn" matTooltip="Change icon">
                    <mat-icon>{{ editIcon || 'category' }}</mat-icon>
                  </button>
                  <mat-menu #editIconMenu="matMenu" class="icon-menu">
                    <div class="icon-grid" (click)="$event.stopPropagation()">
                      @for (icon of iconOptions; track icon) {
                        <button mat-icon-button (click)="editIcon = icon" [class.selected]="editIcon === icon">
                          <mat-icon>{{ icon }}</mat-icon>
                        </button>
                      }
                    </div>
                  </mat-menu>
                  <mat-slide-toggle [(ngModel)]="editFixed" class="edit-toggle">Fixed</mat-slide-toggle>
                  <button mat-icon-button color="primary" (click)="saveEdit(parent)" matTooltip="Save">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button mat-icon-button (click)="cancelEdit()" matTooltip="Cancel">
                    <mat-icon>close</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button (click)="startEdit(parent)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCategory(parent)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button mat-button color="primary" (click)="startAddChild(parent.id)">
                    <mat-icon>add</mat-icon> Add Subcategory
                  </button>
                }
              </div>

              @if (addingChildParentId() === parent.id) {
                <div class="inline-form child-form">
                  <button mat-icon-button [matMenuTriggerFor]="newChildIconMenu" class="icon-picker-btn" matTooltip="Pick icon">
                    <mat-icon>{{ newChildIcon || 'label' }}</mat-icon>
                  </button>
                  <mat-menu #newChildIconMenu="matMenu" class="icon-menu">
                    <div class="icon-grid" (click)="$event.stopPropagation()">
                      @for (icon of iconOptions; track icon) {
                        <button mat-icon-button (click)="newChildIcon = icon" [class.selected]="newChildIcon === icon">
                          <mat-icon>{{ icon }}</mat-icon>
                        </button>
                      }
                    </div>
                  </mat-menu>
                  <mat-form-field appearance="outline">
                    <mat-label>Subcategory Name</mat-label>
                    <input matInput [(ngModel)]="newChildName" (keyup.enter)="saveChild(parent)">
                  </mat-form-field>
                  <mat-slide-toggle [(ngModel)]="newChildFixed">Fixed</mat-slide-toggle>
                  <button mat-icon-button color="primary" (click)="saveChild(parent)" [disabled]="!newChildName.trim()" matTooltip="Save">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button mat-icon-button (click)="cancelAddChild()" matTooltip="Cancel">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }

              @if (parent.children && parent.children.length > 0) {
                <div class="children-list">
                  @for (child of parent.children; track child.id) {
                    <div class="child-row">
                      <span class="cat-icon-badge child-badge" [style.background]="getCatBg(child.name)" [style.border-color]="getCatColor(child.name)">
                        <mat-icon [style.color]="getCatColor(child.name)">{{ child.icon || 'label' }}</mat-icon>
                      </span>
                      @if (editingId() === child.id) {
                        <button mat-icon-button [matMenuTriggerFor]="editChildIconMenu" class="icon-picker-btn" matTooltip="Change icon">
                          <mat-icon>{{ editIcon || 'label' }}</mat-icon>
                        </button>
                        <mat-menu #editChildIconMenu="matMenu" class="icon-menu">
                          <div class="icon-grid" (click)="$event.stopPropagation()">
                            @for (icon of iconOptions; track icon) {
                              <button mat-icon-button (click)="editIcon = icon" [class.selected]="editIcon === icon">
                                <mat-icon>{{ icon }}</mat-icon>
                              </button>
                            }
                          </div>
                        </mat-menu>
                        <input class="inline-edit" [(ngModel)]="editName" (keyup.enter)="saveEdit(child)">
                        <mat-slide-toggle [(ngModel)]="editFixed" class="edit-toggle">Fixed</mat-slide-toggle>
                        <button mat-icon-button color="primary" (click)="saveEdit(child)" matTooltip="Save">
                          <mat-icon>check</mat-icon>
                        </button>
                        <button mat-icon-button (click)="cancelEdit()" matTooltip="Cancel">
                          <mat-icon>close</mat-icon>
                        </button>
                      } @else {
                        <span class="child-name">{{ child.name }}</span>
                        <mat-chip class="child-chip">{{ child.isFixed ? 'Fixed' : 'Variable' }}</mat-chip>
                        <button mat-icon-button (click)="startEdit(child)" matTooltip="Edit">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteCategory(child)" matTooltip="Delete">
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="no-children">No subcategories yet.</p>
              }
            </mat-expansion-panel>
          }
        </mat-accordion>
      } @else {
        <mat-card>
          <mat-card-content>
            <p class="empty-state">No categories in this section. Click "Add Category" to create one.</p>
          </mat-card-content>
        </mat-card>
      }
    </ng-template>
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .page-header {
      display: flex; align-items: center; justify-content: flex-end;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }

    /* Summary Stats */
    .stats-row {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm); margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px; padding: 16px;
      border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-sm);
    }
    .stat-card mat-icon {
      font-size: 24px; width: 44px; height: 44px; min-width: 44px;
      display: flex; align-items: center; justify-content: center; border-radius: 12px;
    }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.2rem; font-weight: 700; color: var(--color-text); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }

    .add-form-card { margin-bottom: var(--spacing-md); }
    .inline-form { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .inline-form mat-form-field { flex: 1; min-width: 200px; }
    .type-toggle { font-size: 0.85rem; }

    .tab-content { padding: var(--spacing-sm) 0; }
    .child-form { margin-top: var(--spacing-sm); padding: var(--spacing-sm) 0; }

    .panel-actions { display: flex; align-items: center; gap: 8px; margin-bottom: var(--spacing-sm); }
    .edit-toggle { margin-right: 8px; }

    .cat-icon-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .parent-badge {
      width: 36px;
      height: 36px;
      border: 1px solid;
    }
    .parent-badge mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .child-badge {
      width: 30px;
      height: 30px;
      border: 1px solid;
    }
    .child-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .cat-label { font-weight: 600; }

    .icon-picker-btn {
      border: 1px dashed var(--color-border);
      border-radius: 8px;
    }
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 2px;
      padding: 8px;
      max-width: 360px;
    }
    .icon-grid button { width: 40px; height: 40px; }
    .icon-grid button.selected {
      background: var(--color-primary);
      color: white;
      border-radius: 8px;
    }

    .children-list { padding: var(--spacing-sm) 0; }
    .child-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border-radius: 10px;
      transition: background 0.15s;
    }
    .child-row:hover { background: var(--color-surface-hover); }
    .child-name { flex: 1; font-size: 0.95rem; font-weight: 500; }
    .child-chip { font-size: 0.75rem; }
    .child-count { margin-left: auto; font-size: 0.85rem; opacity: 0.6; }

    .inline-edit {
      border: 1px solid var(--color-border); border-radius: 4px;
      padding: 6px 10px; font-size: 0.95rem; flex: 1; min-width: 150px;
      background: var(--color-surface); color: var(--color-text);
    }

    .no-children { opacity: 0.6; font-style: italic; padding-left: 16px; }
    .empty-state { opacity: 0.6; font-style: italic; text-align: center; padding: var(--spacing-lg); }

    .search-field { width: 100%; margin-bottom: var(--spacing-sm); }
    .search-field mat-icon { color: var(--color-text-muted); }
    .search-results {
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-md);
      padding: 8px 0; overflow: hidden;
    }
    .search-result-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; transition: background 0.15s;
    }
    .search-result-row:hover { background: var(--color-surface-hover); }
    .search-result-name { flex: 1; font-size: 0.9rem; font-weight: 500; }
    .search-result-type { font-size: 0.72rem; }
    .search-no-results {
      display: flex; align-items: center; gap: 8px; justify-content: center;
      padding: 16px; color: var(--color-text-muted); font-size: 0.9rem;
      margin-bottom: var(--spacing-md);
    }

    mat-expansion-panel { margin-bottom: 8px; }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 599px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px 10px; gap: 8px; }
      .stat-card mat-icon { font-size: 20px; width: 36px; height: 36px; min-width: 36px; border-radius: 10px; }
      .stat-value { font-size: 1rem; }
      .icon-grid { grid-template-columns: repeat(6, 1fr); }
    }
  `]
})
export class CategoryPageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  loading = signal(true);
  allCategories = signal<Category[]>([]);
  activeTab = signal<CategoryType>('Expense');
  searchQuery = signal('');

  expenseCategories = computed(() => this.allCategories().filter(c => c.type === 'Expense'));
  incomeCategories = computed(() => this.allCategories().filter(c => c.type === 'Income'));
  fixedCount = computed(() => this.allCategories().filter(c => c.isFixed).length);

  searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    const results: { parent: Category; child?: Category }[] = [];
    for (const parent of this.allCategories()) {
      if (parent.name.toLowerCase().includes(q)) {
        results.push({ parent });
      }
      if (parent.children) {
        for (const child of parent.children) {
          if (child.name.toLowerCase().includes(q)) {
            results.push({ parent, child });
          }
        }
      }
    }
    return results;
  });

  showAddParent = signal(false);
  newParentName = '';
  newParentFixed = false;
  newParentType: CategoryType = 'Expense';
  newParentIcon = 'category';

  addingChildParentId = signal<number | null>(null);
  newChildName = '';
  newChildFixed = false;
  newChildIcon = 'label';

  editingId = signal<number | null>(null);
  editName = '';
  editFixed = false;
  editIcon = '';

  iconOptions = ICON_OPTIONS;

  ngOnInit(): void {
    this.loadCategories();
  }

  onTabChange(index: number): void {
    this.activeTab.set(index === 0 ? 'Expense' : 'Income');
    this.newParentType = this.activeTab();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe(data => {
      this.allCategories.set(data);
      this.loading.set(false);
    });
  }

  saveParent(): void {
    if (!this.newParentName.trim()) return;
    const dto: CategoryCreate = { name: this.newParentName.trim(), isFixed: this.newParentFixed, type: this.newParentType, icon: this.newParentIcon, parentId: null };
    this.categoryService.create(dto).subscribe({
      next: () => { this.cancelAddParent(); this.loadCategories(); },
      error: (err) => this.showError(err)
    });
  }

  cancelAddParent(): void {
    this.showAddParent.set(false);
    this.newParentName = '';
    this.newParentFixed = false;
    this.newParentIcon = 'category';
  }

  startAddChild(parentId: number): void {
    this.addingChildParentId.set(parentId);
    this.newChildName = '';
    this.newChildFixed = false;
    this.newChildIcon = 'label';
  }

  saveChild(parent: Category): void {
    if (!this.newChildName.trim()) return;
    const dto: CategoryCreate = { name: this.newChildName.trim(), isFixed: this.newChildFixed, type: parent.type, icon: this.newChildIcon, parentId: parent.id };
    this.categoryService.create(dto).subscribe({
      next: () => { this.cancelAddChild(); this.loadCategories(); },
      error: (err) => this.showError(err)
    });
  }

  cancelAddChild(): void {
    this.addingChildParentId.set(null);
    this.newChildName = '';
    this.newChildFixed = false;
    this.newChildIcon = 'label';
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.editName = cat.name;
    this.editFixed = cat.isFixed;
    this.editIcon = cat.icon || 'category';
  }

  saveEdit(cat: Category): void {
    if (!this.editName.trim()) return;
    const dto: CategoryCreate = { name: this.editName.trim(), isFixed: this.editFixed, type: cat.type, icon: this.editIcon, parentId: cat.parentId };
    this.categoryService.update(cat.id, dto).subscribe({
      next: () => { this.cancelEdit(); this.loadCategories(); },
      error: (err) => this.showError(err)
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editName = '';
    this.editFixed = false;
    this.editIcon = '';
  }

  deleteCategory(cat: Category): void {
    import('../../shared/confirm-dialog.component').then(m => {
      this.dialog.open(m.ConfirmDialogComponent, {
        width: '400px',
        data: { title: 'Delete Category?', message: `"${cat.name}" will be permanently removed. Transactions using this category will become uncategorized.`, confirmText: 'Delete', color: 'warn' }
      }).afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.categoryService.delete(cat.id).subscribe({
          next: () => { this.snackBar.open('Category deleted', 'OK', { duration: 3000 }); this.loadCategories(); },
          error: (err) => {
            if (err.status === 409 && err.error?.transactions) {
              this.showLinkedTransactions(cat, err.error);
            } else {
              this.showError(err);
            }
          }
        });
      });
    });
  }

  private showLinkedTransactions(cat: Category, data: any): void {
    const txns = data.transactions as any[];
    const total = data.totalTransactions as number;
    let list = txns.map((t: any) =>
      `• ${new Date(t.date).toLocaleDateString()} — ${t.description} ($${t.amount.toFixed(2)})${t.tag ? ' [' + t.tag + ']' : ''}`
    ).join('\n');
    if (total > txns.length) list += `\n\n...and ${total - txns.length} more`;

    const budgets = data.budgetExpenses as any[];
    if (budgets?.length) {
      list = `Budget items:\n` + budgets.map((b: any) => `• ${b.name} ($${b.amount.toFixed(2)})`).join('\n') + '\n\n' + (txns.length ? `Transactions:\n${list}` : '');
    } else if (txns.length) {
      list = `Transactions using "${cat.name}":\n${list}`;
    }

    import('../../shared/confirm-dialog.component').then(m => {
      this.dialog.open(m.ConfirmDialogComponent, {
        width: '500px',
        data: { title: 'Category In Use', message: list, confirmText: 'Go to Transactions', color: 'primary' }
      }).afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.router.navigate(['/expenses']);
        }
      });
    });
  }

  private showError(err: any): void {
    const msg = err?.error?.message || err?.error || 'An error occurred';
    this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
  }

  getCatColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 55%, 42%)`;
  }

  getCatBg(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 60%, 94%)`;
  }
}
