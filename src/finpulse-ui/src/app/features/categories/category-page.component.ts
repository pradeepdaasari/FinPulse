import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
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
    MatMenuModule
  ],
  template: `
    <div class="page-header">
      <h2>Categories</h2>
      <button mat-raised-button color="primary" (click)="showAddParent.set(true)" [disabled]="showAddParent()">
        <mat-icon>add</mat-icon> Add Category
      </button>
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
                  <span class="cat-icon-badge parent-badge">
                    <mat-icon>{{ parent.icon || 'category' }}</mat-icon>
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
                      <span class="cat-icon-badge child-badge">
                        <mat-icon>{{ child.icon || 'label' }}</mat-icon>
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
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .page-header h2 { margin: 0; display: flex; align-items: center; }

    .add-form-card { margin-bottom: var(--spacing-md); }
    .inline-form { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .inline-form mat-form-field { flex: 1; min-width: 200px; }
    .type-toggle { font-size: 0.85rem; }

    .tab-content { padding: var(--spacing-md) 0; }
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
      background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-primary) 6%, transparent));
      border: 1px solid var(--color-border);
    }
    .parent-badge mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--color-primary);
    }
    .child-badge {
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, color-mix(in srgb, var(--color-text-muted) 10%, transparent), color-mix(in srgb, var(--color-text-muted) 5%, transparent));
      border: 1px solid var(--color-border);
    }
    .child-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--color-text-secondary);
    }
    .cat-label { font-weight: 600; }

    .icon-picker-btn {
      border: 1px dashed var(--color-border, #ccc);
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
    .child-row:hover { background: var(--color-hover, rgba(0,0,0,0.04)); }
    .child-name { flex: 1; font-size: 0.95rem; font-weight: 500; }
    .child-chip { font-size: 0.75rem; }
    .child-count { margin-left: auto; font-size: 0.85rem; opacity: 0.6; }

    .inline-edit {
      border: 1px solid var(--color-border, #ccc); border-radius: 4px;
      padding: 6px 10px; font-size: 0.95rem; flex: 1; min-width: 150px;
    }

    .no-children { opacity: 0.6; font-style: italic; padding-left: 16px; }
    .empty-state { opacity: 0.6; font-style: italic; text-align: center; padding: var(--spacing-lg); }

    mat-expansion-panel { margin-bottom: 8px; }
  `]
})
export class CategoryPageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);

  allCategories = signal<Category[]>([]);
  activeTab = signal<CategoryType>('Expense');

  expenseCategories = computed(() => this.allCategories().filter(c => c.type === 'Expense'));
  incomeCategories = computed(() => this.allCategories().filter(c => c.type === 'Income'));

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
    this.categoryService.getAll().subscribe(data => this.allCategories.set(data));
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
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    this.categoryService.delete(cat.id).subscribe({
      next: () => this.loadCategories(),
      error: (err) => this.showError(err)
    });
  }

  private showError(err: any): void {
    const msg = err?.error?.message || err?.error || 'An error occurred';
    this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
  }
}
