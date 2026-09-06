import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
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
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';
import { CategoryService } from '../../../core/services/category.service';
import { Category, CategoryCreate, CategoryType } from '../../../core/models/category.model';

interface IconGroup {
  label: string;
  color: string;
  bg: string;
  icons: string[];
}

const ICON_GROUPS: IconGroup[] = [
  { label: 'Housing', color: '#1565c0', bg: 'rgba(21,101,192,0.1)', icons: [
    'home', 'apartment', 'house', 'cottage', 'villa', 'real_estate_agent', 'door_front', 'bed', 'chair', 'weekend',
    'kitchen', 'bathtub', 'yard', 'roofing', 'foundation', 'fence'
  ]},
  { label: 'Transport', color: '#00838f', bg: 'rgba(0,131,143,0.1)', icons: [
    'directions_car', 'local_gas_station', 'local_parking', 'electric_car', 'car_rental', 'car_crash',
    'directions_bus', 'train', 'flight', 'local_taxi', 'two_wheeler', 'pedal_bike', 'sailing', 'hail', 'toll', 'ev_station'
  ]},
  { label: 'Food & Drink', color: '#d84315', bg: 'rgba(216,67,21,0.1)', icons: [
    'restaurant', 'dinner_dining', 'coffee', 'local_cafe', 'local_bar', 'local_pizza', 'bakery_dining',
    'lunch_dining', 'brunch_dining', 'ramen_dining', 'delivery_dining', 'takeout_dining',
    'icecream', 'liquor', 'local_grocery_store', 'egg'
  ]},
  { label: 'Shopping', color: '#7b1fa2', bg: 'rgba(123,31,162,0.1)', icons: [
    'shopping_cart', 'shopping_bag', 'storefront', 'local_mall', 'checkroom', 'diamond', 'watch',
    'redeem', 'card_giftcard', 'local_offer', 'sell', 'style'
  ]},
  { label: 'Bills & Utilities', color: '#f57f17', bg: 'rgba(245,127,23,0.1)', icons: [
    'bolt', 'electrical_services', 'water_drop', 'gas_meter', 'thermostat', 'phone_android', 'wifi',
    'router', 'cell_tower', 'mail', 'local_post_office', 'receipt', 'receipt_long', 'description'
  ]},
  { label: 'Entertainment', color: '#e91e63', bg: 'rgba(233,30,99,0.1)', icons: [
    'movie', 'live_tv', 'subscriptions', 'headphones', 'music_note', 'videogame_asset', 'sports_esports',
    'celebration', 'nightlife', 'casino', 'theater_comedy', 'stadium', 'attractions', 'park', 'apps', 'cloud'
  ]},
  { label: 'Health & Fitness', color: '#c62828', bg: 'rgba(198,40,40,0.1)', icons: [
    'favorite', 'local_hospital', 'medication', 'vaccines', 'spa', 'fitness_center', 'self_improvement',
    'monitor_heart', 'psychology', 'health_and_safety', 'emergency', 'medical_services', 'bloodtype', 'hearing'
  ]},
  { label: 'Education', color: '#0277bd', bg: 'rgba(2,119,189,0.1)', icons: [
    'school', 'menu_book', 'auto_stories', 'history_edu', 'science', 'biotech', 'calculate',
    'architecture', 'draw', 'palette', 'translate', 'library_books'
  ]},
  { label: 'Finance', color: '#2e7d32', bg: 'rgba(46,125,50,0.1)', icons: [
    'savings', 'account_balance', 'payments', 'attach_money', 'monetization_on', 'trending_up', 'trending_down',
    'pie_chart', 'percent', 'currency_exchange', 'credit_card', 'price_check', 'request_quote', 'paid'
  ]},
  { label: 'Work & Business', color: '#455a64', bg: 'rgba(69,90,100,0.1)', icons: [
    'work', 'laptop', 'business_center', 'meeting_room', 'badge', 'handyman', 'engineering',
    'construction', 'precision_manufacturing', 'build', 'plumbing', 'carpenter'
  ]},
  { label: 'Family & Personal', color: '#6a1b9a', bg: 'rgba(106,27,154,0.1)', icons: [
    'child_care', 'child_friendly', 'baby_changing_station', 'stroller', 'pets', 'elderly', 'elderly_woman',
    'face', 'diversity_3', 'volunteer_activism', 'loyalty', 'favorite_border'
  ]},
  { label: 'Insurance & Legal', color: '#37474f', bg: 'rgba(55,71,79,0.1)', icons: [
    'shield', 'security', 'verified_user', 'gavel', 'policy', 'assured_workload',
    'admin_panel_settings', 'lock', 'privacy_tip'
  ]},
  { label: 'Travel', color: '#00897b', bg: 'rgba(0,137,123,0.1)', icons: [
    'luggage', 'hotel', 'beach_access', 'pool', 'hiking', 'snowboarding', 'surfing',
    'kayaking', 'paragliding', 'map', 'explore', 'public', 'language'
  ]},
  { label: 'General', color: '#546e7a', bg: 'rgba(84,110,122,0.1)', icons: [
    'category', 'label', 'bookmark', 'schedule', 'event', 'star', 'flag',
    'push_pin', 'lightbulb', 'info', 'help', 'more_horiz'
  ]},
];

const ICON_OPTIONS = ICON_GROUPS.flatMap(g => g.icons);

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatExpansionModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule,
    MatSnackBarModule, MatTooltipModule, MatChipsModule, MatTabsModule, MatButtonToggleModule,
    MatMenuModule, SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadCategories()">
    @if (loading()) {
      <app-skeleton type="list"></app-skeleton>
    } @else {

    <!-- ═══════ MOBILE VIEW ═══════ -->
    <div class="mobile-view">
      <!-- Search -->
      <div class="m-search-bar">
        <mat-icon>search</mat-icon>
        <input placeholder="Search categories..." [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)">
        @if (searchQuery()) {
          <button class="m-search-clear" (click)="searchQuery.set('')">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      <!-- Segmented Control + Add -->
      <div class="m-toolbar-row">
        <div class="m-segment">
          <button class="m-seg-btn" [class.active]="activeTab() === 'Expense'" (click)="activeTab.set('Expense')">
            Expense ({{ expenseCategories().length }})
          </button>
          <button class="m-seg-btn" [class.active]="activeTab() === 'Income'" (click)="activeTab.set('Income')">
            Income ({{ incomeCategories().length }})
          </button>
        </div>
        <button class="m-add-btn" (click)="showMobileAddSheet.set(true)">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <!-- Search Results -->
      @if (searchQuery() && searchResults().length > 0) {
        <div class="m-group">
          <div class="m-group-label">Search Results</div>
          @for (result of searchResults(); track result.child?.id || result.parent.id) {
            <div class="m-row">
              <span class="m-row-icon" [style.background]="getCatBg(result.child?.name || result.parent.name)" [style.border-color]="getCatColor(result.child?.name || result.parent.name)">
                <mat-icon [style.color]="getCatColor(result.child?.name || result.parent.name)">{{ inferIcon(result.child?.name || result.parent.name, result.child?.icon || result.parent.icon, 'category') }}</mat-icon>
              </span>
              <span class="m-row-label">
                @if (result.child) {
                  {{ result.parent.name }} → {{ result.child.name }}
                } @else {
                  {{ result.parent.name }}
                }
              </span>
              <span class="m-row-chip">{{ result.parent.type }}</span>
            </div>
          }
        </div>
      } @else if (searchQuery() && searchResults().length === 0) {
        <div class="m-empty-search">
          <mat-icon>search_off</mat-icon>
          <span>No results for "{{ searchQuery() }}"</span>
        </div>
      }

      <!-- Category Groups -->
      @if (!searchQuery()) {
        @for (parent of activeCategories(); track parent.id) {
          <div class="m-group">
            <!-- Parent Header -->
            <div class="m-parent-header" (click)="toggleMobileExpand(parent.id)">
              <span class="m-row-icon" [style.background]="getCatBg(parent.name)" [style.border-color]="getCatColor(parent.name)">
                <mat-icon [style.color]="getCatColor(parent.name)">{{ inferIcon(parent.name, parent.icon, 'category') }}</mat-icon>
              </span>
              @if (editingId() === parent.id) {
                <input class="m-inline-edit" [(ngModel)]="editName" (keyup.enter)="saveEdit(parent)" (click)="$event.stopPropagation()">
                <button class="m-action-btn save" (click)="saveEdit(parent); $event.stopPropagation()">
                  <mat-icon>check</mat-icon>
                </button>
                <button class="m-action-btn" (click)="cancelEdit(); $event.stopPropagation()">
                  <mat-icon>close</mat-icon>
                </button>
              } @else {
                <div class="m-parent-info">
                  <span class="m-parent-name">{{ parent.name }}</span>
                  <span class="m-parent-meta">{{ parent.children?.length || 0 }} items · {{ parent.isFixed ? 'Fixed' : 'Variable' }}</span>
                </div>
                <mat-icon class="m-chevron" [class.expanded]="isMobileExpanded(parent.id)">expand_more</mat-icon>
              }
            </div>

            <!-- Children (collapsible) -->
            @if (isMobileExpanded(parent.id)) {
              <!-- Actions Row -->
              <div class="m-actions-row">
                <button class="m-action-pill" (click)="startEdit(parent)">
                  <mat-icon>edit</mat-icon> Edit
                </button>
                <button class="m-action-pill danger" (click)="deleteCategory(parent)">
                  <mat-icon>delete</mat-icon> Delete
                </button>
                <button class="m-action-pill primary" (click)="startMobileAdd(parent.id)">
                  <mat-icon>add</mat-icon> Subcategory
                </button>
              </div>

              @if (parent.children && parent.children.length > 0) {
                @for (child of parent.children; track child.id) {
                  <div class="m-row" [class.m-row-editing]="editingId() === child.id">
                    <span class="m-row-icon sm" [style.background]="getCatBg(child.name)" [style.border-color]="getCatColor(child.name)">
                      <mat-icon [style.color]="getCatColor(child.name)">{{ inferIcon(child.name, child.icon, 'label') }}</mat-icon>
                    </span>
                    @if (editingId() === child.id) {
                      <input class="m-inline-edit" [(ngModel)]="editName" (keyup.enter)="saveEdit(child)" (click)="$event.stopPropagation()">
                      <button class="m-action-btn save" (click)="saveEdit(child)">
                        <mat-icon>check</mat-icon>
                      </button>
                      <button class="m-action-btn" (click)="cancelEdit()">
                        <mat-icon>close</mat-icon>
                      </button>
                    } @else {
                      <span class="m-row-label">{{ child.name }}</span>
                      <span class="m-row-chip sm">{{ child.isFixed ? 'Fixed' : 'Var' }}</span>
                      <button class="m-action-btn" (click)="startEdit(child)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button class="m-action-btn danger" (click)="deleteCategory(child)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </div>
                }
              } @else {
                <div class="m-row m-row-empty">
                  <mat-icon>info_outline</mat-icon>
                  <span>No subcategories</span>
                </div>
              }

              <!-- Inline add child -->
              @if (addingChildParentId() === parent.id) {
                <div class="m-add-child">
                  <button class="m-icon-pick" [matMenuTriggerFor]="mChildIconMenu">
                    <mat-icon>{{ newChildIcon || 'label' }}</mat-icon>
                  </button>
                  <mat-menu #mChildIconMenu="matMenu" class="icon-menu" (closed)="iconSearch.set('')">
                    <div class="icon-groups-picker" (click)="$event.stopPropagation()">
                      <div class="icon-search-box">
                        <mat-icon>search</mat-icon>
                        <input placeholder="Search icons..." [value]="iconSearch()" (input)="iconSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
                      </div>
                      @for (group of filteredIconGroups(); track group.label) {
                        <div class="icon-group-section">
                          <div class="icon-group-label" [style.color]="group.color">{{ group.label }}</div>
                          <div class="icon-grid">
                            @for (icon of group.icons; track icon) {
                              <button mat-icon-button (click)="newChildIcon = icon" [class.selected]="newChildIcon === icon">
                                <mat-icon [style.color]="newChildIcon === icon ? '#fff' : group.color">{{ icon }}</mat-icon>
                              </button>
                            }
                          </div>
                        </div>
                      }
                      @if (filteredIconGroups().length === 0) {
                        <div class="icon-no-results">No icons found</div>
                      }
                    </div>
                  </mat-menu>
                  <input class="m-inline-edit flex-1" [(ngModel)]="newChildName" placeholder="Subcategory name" (keyup.enter)="saveChild(parent)">
                  <mat-slide-toggle [(ngModel)]="newChildFixed" class="m-toggle-sm">Fixed</mat-slide-toggle>
                  <button class="m-action-btn save" (click)="saveChild(parent)" [disabled]="!newChildName.trim()">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button class="m-action-btn" (click)="cancelAddChild()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            }
          </div>
        }

        @if (activeCategories().length === 0) {
          <div class="m-empty">
            <mat-icon>category</mat-icon>
            <span>No categories yet</span>
            <span class="m-empty-hint">Tap the + button above to add one</span>
          </div>
        }
      }

      <!-- Bottom Sheet for Add -->
      @if (showMobileAddSheet()) {
        <div class="m-sheet-backdrop" (click)="closeMobileAddSheet()"></div>
        <div class="m-sheet">
          <div class="m-sheet-handle"></div>
          <h3 class="m-sheet-title">New Category</h3>
          <div class="m-sheet-form">
            <button class="m-icon-pick lg" [matMenuTriggerFor]="mNewIconMenu">
              <mat-icon>{{ newParentIcon || 'category' }}</mat-icon>
            </button>
            <mat-menu #mNewIconMenu="matMenu" class="icon-menu" (closed)="iconSearch.set('')">
              <div class="icon-groups-picker" (click)="$event.stopPropagation()">
                <div class="icon-search-box">
                  <mat-icon>search</mat-icon>
                  <input placeholder="Search icons..." [value]="iconSearch()" (input)="iconSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
                </div>
                @for (group of filteredIconGroups(); track group.label) {
                  <div class="icon-group-section">
                    <div class="icon-group-label" [style.color]="group.color">{{ group.label }}</div>
                    <div class="icon-grid">
                      @for (icon of group.icons; track icon) {
                        <button mat-icon-button (click)="newParentIcon = icon" [class.selected]="newParentIcon === icon">
                          <mat-icon [style.color]="newParentIcon === icon ? '#fff' : group.color">{{ icon }}</mat-icon>
                        </button>
                      }
                    </div>
                  </div>
                }
                @if (filteredIconGroups().length === 0) {
                  <div class="icon-no-results">No icons found</div>
                }
              </div>
            </mat-menu>
            <mat-form-field appearance="outline" class="m-field">
              <mat-label>Category Name</mat-label>
              <input matInput [(ngModel)]="newParentName" (keyup.enter)="saveMobileParent()">
            </mat-form-field>
            <div class="m-sheet-row">
              <div class="m-segment sm">
                <button class="m-seg-btn" [class.active]="newParentType === 'Expense'" (click)="newParentType = 'Expense'">Expense</button>
                <button class="m-seg-btn" [class.active]="newParentType === 'Income'" (click)="newParentType = 'Income'">Income</button>
              </div>
              <mat-slide-toggle [(ngModel)]="newParentFixed">Fixed</mat-slide-toggle>
            </div>
            <button mat-raised-button color="primary" class="m-sheet-save" (click)="saveMobileParent()" [disabled]="!newParentName.trim()">
              <mat-icon>check</mat-icon> Save Category
            </button>
          </div>
        </div>
      }
    </div>

    <!-- ═══════ DESKTOP VIEW ═══════ -->
    <div class="desktop-view">
      <div class="page-header">
        <button mat-raised-button color="primary" (click)="showAddParent.set(true)" [disabled]="showAddParent()">
          <mat-icon>add</mat-icon> Add Category
        </button>
      </div>

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
              <mat-menu #newParentIconMenu="matMenu" class="icon-menu" (closed)="iconSearch.set('')">
                <div class="icon-groups-picker" (click)="$event.stopPropagation()">
                  <div class="icon-search-box">
                    <mat-icon>search</mat-icon>
                    <input placeholder="Search icons..." [value]="iconSearch()" (input)="iconSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
                  </div>
                  @for (group of filteredIconGroups(); track group.label) {
                    <div class="icon-group-section">
                      <div class="icon-group-label" [style.color]="group.color">{{ group.label }}</div>
                      <div class="icon-grid">
                        @for (icon of group.icons; track icon) {
                          <button mat-icon-button (click)="newParentIcon = icon" [class.selected]="newParentIcon === icon">
                            <mat-icon [style.color]="newParentIcon === icon ? '#fff' : group.color">{{ icon }}</mat-icon>
                          </button>
                        }
                      </div>
                    </div>
                  }
                  @if (filteredIconGroups().length === 0) {
                    <div class="icon-no-results">No icons found</div>
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
                <mat-icon [style.color]="getCatColor(result.child?.name || result.parent.name)">{{ inferIcon(result.child?.name || result.parent.name, result.child?.icon || result.parent.icon, 'category') }}</mat-icon>
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
                      <mat-icon [style.color]="getCatColor(parent.name)">{{ inferIcon(parent.name, parent.icon, 'category') }}</mat-icon>
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
                    <mat-menu #editIconMenu="matMenu" class="icon-menu" (closed)="iconSearch.set('')">
                      <div class="icon-groups-picker" (click)="$event.stopPropagation()">
                        <div class="icon-search-box">
                          <mat-icon>search</mat-icon>
                          <input placeholder="Search icons..." [value]="iconSearch()" (input)="iconSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
                        </div>
                        @for (group of filteredIconGroups(); track group.label) {
                          <div class="icon-group-section">
                            <div class="icon-group-label" [style.color]="group.color">{{ group.label }}</div>
                            <div class="icon-grid">
                              @for (icon of group.icons; track icon) {
                                <button mat-icon-button (click)="editIcon = icon" [class.selected]="editIcon === icon">
                                  <mat-icon [style.color]="editIcon === icon ? '#fff' : group.color">{{ icon }}</mat-icon>
                                </button>
                              }
                            </div>
                          </div>
                        }
                        @if (filteredIconGroups().length === 0) {
                          <div class="icon-no-results">No icons found</div>
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
                    <button mat-icon-button [matMenuTriggerFor]="newChildIconMenuD" class="icon-picker-btn" matTooltip="Pick icon">
                      <mat-icon>{{ newChildIcon || 'label' }}</mat-icon>
                    </button>
                    <mat-menu #newChildIconMenuD="matMenu" class="icon-menu" (closed)="iconSearch.set('')">
                      <div class="icon-groups-picker" (click)="$event.stopPropagation()">
                        <div class="icon-search-box">
                          <mat-icon>search</mat-icon>
                          <input placeholder="Search icons..." [value]="iconSearch()" (input)="iconSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
                        </div>
                        @for (group of filteredIconGroups(); track group.label) {
                          <div class="icon-group-section">
                            <div class="icon-group-label" [style.color]="group.color">{{ group.label }}</div>
                            <div class="icon-grid">
                              @for (icon of group.icons; track icon) {
                                <button mat-icon-button (click)="newChildIcon = icon" [class.selected]="newChildIcon === icon">
                                  <mat-icon [style.color]="newChildIcon === icon ? '#fff' : group.color">{{ icon }}</mat-icon>
                                </button>
                              }
                            </div>
                          </div>
                        }
                        @if (filteredIconGroups().length === 0) {
                          <div class="icon-no-results">No icons found</div>
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
                          <mat-icon [style.color]="getCatColor(child.name)">{{ inferIcon(child.name, child.icon, 'label') }}</mat-icon>
                        </span>
                        @if (editingId() === child.id) {
                          <button mat-icon-button [matMenuTriggerFor]="editChildIconMenuD" class="icon-picker-btn" matTooltip="Change icon">
                            <mat-icon>{{ editIcon || 'label' }}</mat-icon>
                          </button>
                          <mat-menu #editChildIconMenuD="matMenu" class="icon-menu" (closed)="iconSearch.set('')">
                            <div class="icon-groups-picker" (click)="$event.stopPropagation()">
                              <div class="icon-search-box">
                                <mat-icon>search</mat-icon>
                                <input placeholder="Search icons..." [value]="iconSearch()" (input)="iconSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
                              </div>
                              @for (group of filteredIconGroups(); track group.label) {
                                <div class="icon-group-section">
                                  <div class="icon-group-label" [style.color]="group.color">{{ group.label }}</div>
                                  <div class="icon-grid">
                                    @for (icon of group.icons; track icon) {
                                      <button mat-icon-button (click)="editIcon = icon" [class.selected]="editIcon === icon">
                                        <mat-icon [style.color]="editIcon === icon ? '#fff' : group.color">{{ icon }}</mat-icon>
                                      </button>
                                    }
                                  </div>
                                </div>
                              }
                              @if (filteredIconGroups().length === 0) {
                                <div class="icon-no-results">No icons found</div>
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
    </div>

    }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ═══════ MOBILE / DESKTOP TOGGLE ═══════ */
    .mobile-view { display: none; }
    .desktop-view { display: block; }
    @media (max-width: 599px) {
      .mobile-view { display: block; }
      .desktop-view { display: none !important; }
    }

    /* ═══════ MOBILE STYLES ═══════ */
    .m-search-bar {
      display: flex; align-items: center; gap: 8px;
      background: var(--color-surface-secondary, #f1f5f9);
      border-radius: 12px; padding: 10px 14px;
      margin-bottom: 12px;
    }
    .m-search-bar mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); flex-shrink: 0; }
    .m-search-bar input {
      border: none; outline: none; flex: 1; font-size: 0.9rem;
      background: transparent; color: var(--color-text); min-width: 0;
    }
    .m-search-clear {
      background: none; border: none; padding: 0; display: flex;
      align-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent;
    }
    .m-search-clear mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }

    /* Toolbar row: segment + add */
    .m-toolbar-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    }
    .m-segment {
      display: flex; flex: 1; background: var(--color-surface-secondary, #f1f5f9);
      border-radius: 10px; padding: 3px; gap: 2px;
    }
    .m-add-btn {
      width: 40px; height: 40px; min-width: 40px; border-radius: 12px; border: none;
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; -webkit-tap-highlight-color: transparent;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .m-add-btn:active { transform: scale(0.92); }
    .m-add-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .m-segment.sm { width: auto; }
    .m-seg-btn {
      flex: 1; border: none; background: transparent; padding: 8px 16px;
      font-size: 0.82rem; font-weight: 600; border-radius: 8px;
      color: var(--color-text-muted); cursor: pointer;
      transition: all 0.2s; -webkit-tap-highlight-color: transparent;
    }
    .m-seg-btn.active {
      background: var(--color-surface); color: var(--color-text);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Groups */
    .m-group {
      background: var(--color-surface); border-radius: 14px;
      overflow: hidden; margin-bottom: 12px;
      box-shadow: var(--shadow-sm);
    }
    .m-group-label {
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--color-text-muted);
      padding: 8px 16px 4px;
    }

    /* Parent header */
    .m-parent-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;
    }
    .m-parent-header:active { background: var(--color-surface-secondary); }
    .m-parent-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .m-parent-name { font-size: 0.92rem; font-weight: 600; color: var(--color-text); }
    .m-parent-meta { font-size: 0.72rem; color: var(--color-text-muted); }
    .m-chevron {
      font-size: 22px; width: 22px; height: 22px;
      color: var(--color-text-muted); transition: transform 0.25s;
    }
    .m-chevron.expanded { transform: rotate(180deg); }

    /* Action row */
    .m-actions-row {
      display: flex; gap: 8px; padding: 8px 16px 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .m-action-pill {
      display: flex; align-items: center; gap: 4px;
      padding: 6px 12px; border-radius: 20px; border: 1px solid var(--color-border);
      background: var(--color-surface); font-size: 0.72rem; font-weight: 600;
      color: var(--color-text-muted); cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .m-action-pill:active { transform: scale(0.95); }
    .m-action-pill mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .m-action-pill.danger { color: var(--color-danger); border-color: color-mix(in srgb, var(--color-danger) 30%, transparent); }
    .m-action-pill.primary { color: var(--color-primary); border-color: color-mix(in srgb, var(--color-primary) 30%, transparent); }

    /* Rows */
    .m-row {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px 12px 28px; min-height: 48px;
      border-bottom: 1px solid var(--color-border);
      -webkit-tap-highlight-color: transparent;
    }
    .m-row:last-child { border-bottom: none; }
    .m-row-editing { background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface)); }
    .m-row-empty { justify-content: center; color: var(--color-text-muted); font-size: 0.82rem; padding: 16px; gap: 6px; }
    .m-row-empty mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .m-row-icon {
      width: 32px; height: 32px; min-width: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid;
    }
    .m-row-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .m-row-icon.sm { width: 28px; height: 28px; min-width: 28px; border-radius: 7px; }
    .m-row-icon.sm mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .m-row-label { flex: 1; font-size: 0.88rem; font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .m-row-chip {
      font-size: 0.62rem; font-weight: 700; padding: 2px 8px;
      border-radius: 20px; background: var(--color-surface-secondary);
      color: var(--color-text-muted); text-transform: uppercase;
      letter-spacing: 0.03em; flex-shrink: 0;
    }
    .m-row-chip.sm { padding: 1px 6px; font-size: 0.58rem; }

    .m-action-btn {
      width: 34px; height: 34px; border: none; border-radius: 8px;
      background: transparent; display: flex; align-items: center;
      justify-content: center; cursor: pointer; flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .m-action-btn:active { background: var(--color-surface-secondary); }
    .m-action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .m-action-btn.save mat-icon { color: var(--color-primary); }
    .m-action-btn.danger mat-icon { color: var(--color-danger); }

    .m-inline-edit {
      flex: 1; min-width: 0; border: 1px solid var(--color-primary);
      border-radius: 8px; padding: 8px 12px; font-size: 0.88rem;
      background: var(--color-surface); color: var(--color-text);
      outline: none;
    }
    .flex-1 { flex: 1; }

    /* Add child inline */
    .m-add-child {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px 12px 28px; border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap;
    }
    .m-toggle-sm { transform: scale(0.85); transform-origin: left center; }

    .m-icon-pick {
      width: 40px; height: 40px; border: 1px dashed var(--color-border);
      border-radius: 10px; background: var(--color-surface-secondary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .m-icon-pick mat-icon { font-size: 22px; width: 22px; height: 22px; color: var(--color-text-muted); }
    .m-icon-pick.lg { width: 52px; height: 52px; border-radius: 14px; }
    .m-icon-pick.lg mat-icon { font-size: 28px; width: 28px; height: 28px; }

    /* Empty */
    .m-empty {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 48px 20px; color: var(--color-text-muted);
    }
    .m-empty mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.3; }
    .m-empty span { font-size: 0.9rem; font-weight: 600; }
    .m-empty-hint { font-size: 0.78rem; opacity: 0.6; }
    .m-empty-search {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 24px; color: var(--color-text-muted); font-size: 0.85rem;
    }



    /* Bottom Sheet */
    .m-sheet-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      z-index: 1199; animation: fadeIn 0.2s;
    }
    .m-sheet {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 1200;
      background: var(--color-surface); border-radius: 20px 20px 0 0;
      padding: 12px 20px calc(env(safe-area-inset-bottom, 16px) + 100px);
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
      animation: slideUp 0.3s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .m-sheet-handle {
      width: 36px; height: 4px; border-radius: 2px;
      background: var(--color-border); margin: 0 auto 16px;
    }
    .m-sheet-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 16px; text-align: center; }
    .m-sheet-form { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .m-field { width: 100%; }
    .m-sheet-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; }
    .m-sheet-save { width: 100%; height: 48px; font-size: 0.9rem; font-weight: 600; border-radius: 12px; }

    /* ═══════ DESKTOP STYLES ═══════ */
    .page-header {
      display: flex; align-items: center; justify-content: flex-end;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
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
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 10px; margin-right: 12px; flex-shrink: 0;
    }
    .parent-badge { width: 36px; height: 36px; border: 1px solid; }
    .parent-badge mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .child-badge { width: 30px; height: 30px; border: 1px solid; }
    .child-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .cat-label { font-weight: 600; }

    .icon-picker-btn { border: 1px dashed var(--color-border); border-radius: 8px; }
    .icon-groups-picker { max-height: 400px; overflow-y: auto; padding: 4px 8px 8px; max-width: 380px; }
    .icon-search-box {
      display: flex; align-items: center; gap: 8px; padding: 8px 8px 6px;
      position: sticky; top: 0; background: var(--color-surface); z-index: 10;
      border-bottom: 1px solid var(--color-border); margin-bottom: 4px;
    }
    .icon-search-box mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); flex-shrink: 0; }
    .icon-search-box input {
      border: none; outline: none; flex: 1; font-size: 0.85rem;
      background: transparent; color: var(--color-text); min-width: 0;
    }
    .icon-no-results { text-align: center; padding: 20px 8px; color: var(--color-text-muted); font-size: 0.82rem; }
    .icon-group-section { margin-bottom: 4px; }
    .icon-group-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 4px 2px; }
    .icon-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; }
    .icon-grid button { width: 36px; height: 36px; }
    .icon-grid button mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .icon-grid button.selected { background: var(--color-primary); border-radius: 8px; }

    .children-list { padding: var(--spacing-sm) 0; }
    .child-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border-radius: 10px; transition: background 0.15s;
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
  `]
})
export class CategoryPageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  allCategories = signal<Category[]>([]);
  activeTab = signal<CategoryType>('Expense');
  searchQuery = signal('');

  expenseCategories = computed(() => this.allCategories().filter(c => c.type === 'Expense'));
  incomeCategories = computed(() => this.allCategories().filter(c => c.type === 'Income'));
  fixedCount = computed(() => this.allCategories().filter(c => c.isFixed).length);
  activeCategories = computed(() =>
    this.activeTab() === 'Expense' ? this.expenseCategories() : this.incomeCategories()
  );

  searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    const results: { parent: Category; child?: Category }[] = [];
    for (const parent of this.allCategories()) {
      if (parent.name.toLowerCase().includes(q)) results.push({ parent });
      if (parent.children) {
        for (const child of parent.children) {
          if (child.name.toLowerCase().includes(q)) results.push({ parent, child });
        }
      }
    }
    return results;
  });

  showAddParent = signal(false);
  showMobileAddSheet = signal(false);
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
  iconGroups = ICON_GROUPS;
  iconSearch = signal('');

  private mobileExpandedIds = signal<Set<number>>(new Set());

  filteredIconGroups = computed(() => {
    const q = this.iconSearch().toLowerCase().replace(/[_\s]+/g, '');
    if (!q) return ICON_GROUPS;
    return ICON_GROUPS
      .map(g => ({ ...g, icons: g.icons.filter(icon => icon.replace(/_/g, '').includes(q) || g.label.toLowerCase().replace(/\s+/g, '').includes(q)) }))
      .filter(g => g.icons.length > 0);
  });

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
      this.cdr.detectChanges();
    });
  }

  toggleMobileExpand(id: number): void {
    const current = new Set(this.mobileExpandedIds());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.mobileExpandedIds.set(current);
  }

  isMobileExpanded(id: number): boolean {
    return this.mobileExpandedIds().has(id);
  }

  startMobileAdd(parentId: number): void {
    this.addingChildParentId.set(parentId);
    this.newChildName = '';
    this.newChildFixed = false;
    this.newChildIcon = 'label';
  }

  saveMobileParent(): void {
    if (!this.newParentName.trim()) return;
    const dto: CategoryCreate = { name: this.newParentName.trim(), isFixed: this.newParentFixed, type: this.newParentType, icon: this.newParentIcon, parentId: null };
    this.categoryService.create(dto).subscribe({
      next: () => { this.closeMobileAddSheet(); this.loadCategories(); },
      error: (err) => this.showError(err)
    });
  }

  closeMobileAddSheet(): void {
    this.showMobileAddSheet.set(false);
    this.newParentName = '';
    this.newParentFixed = false;
    this.newParentIcon = 'category';
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
    import('../../../shared/confirm-dialog.component').then(m => {
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
    import('../../../shared/confirm-dialog.component').then(m => {
      this.dialog.open(m.ConfirmDialogComponent, {
        width: '500px',
        data: { title: 'Category In Use', message: list, confirmText: 'Go to Transactions', color: 'primary' }
      }).afterClosed().subscribe(confirmed => {
        if (confirmed) this.router.navigate(['/expenses']);
      });
    });
  }

  private showError(err: any): void {
    const msg = err?.error?.message || err?.error || 'An error occurred';
    this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
  }

  private static readonly ICON_MAP: Record<string, string> = {
    rent: 'home', mortgage: 'house', housing: 'home', apartment: 'apartment', maintenance: 'build',
    furniture: 'weekend', appliances: 'kitchen', cleaning: 'cleaning_services', hoa: 'apartment',
    gas: 'local_gas_station', fuel: 'local_gas_station', parking: 'local_parking', car: 'directions_car',
    auto: 'directions_car', uber: 'local_taxi', lyft: 'local_taxi', taxi: 'local_taxi',
    bus: 'directions_bus', train: 'train', transit: 'directions_bus', tolls: 'toll', toll: 'toll',
    'car insurance': 'shield', 'car wash': 'local_car_wash', ev: 'ev_station', bike: 'pedal_bike',
    groceries: 'local_grocery_store', grocery: 'local_grocery_store', restaurant: 'restaurant',
    'dining out': 'restaurant', 'eating out': 'restaurant', coffee: 'coffee', cafe: 'local_cafe',
    pizza: 'local_pizza', 'fast food': 'lunch_dining', delivery: 'delivery_dining',
    snacks: 'icecream', alcohol: 'liquor', beer: 'local_bar', bar: 'local_bar', wine: 'liquor',
    bakery: 'bakery_dining', brunch: 'brunch_dining', lunch: 'lunch_dining', dinner: 'dinner_dining',
    food: 'restaurant', takeout: 'takeout_dining',
    clothing: 'checkroom', clothes: 'checkroom', shoes: 'checkroom', fashion: 'checkroom',
    amazon: 'shopping_cart', online: 'shopping_cart', shopping: 'shopping_bag',
    electronics: 'devices', gifts: 'redeem', jewelry: 'diamond',
    electric: 'bolt', electricity: 'bolt', power: 'bolt', water: 'water_drop',
    internet: 'wifi', phone: 'phone_android', mobile: 'phone_android', cable: 'live_tv',
    utilities: 'bolt', utility: 'bolt', sewer: 'water_drop', trash: 'delete',
    netflix: 'live_tv', hulu: 'live_tv', disney: 'live_tv', streaming: 'live_tv',
    spotify: 'headphones', music: 'music_note', movies: 'movie', movie: 'movie', games: 'videogame_asset',
    gaming: 'sports_esports', concerts: 'celebration', entertainment: 'celebration', hobbies: 'palette',
    books: 'menu_book', subscriptions: 'subscriptions', subscription: 'subscriptions',
    gym: 'fitness_center', fitness: 'fitness_center', workout: 'fitness_center',
    doctor: 'local_hospital', medical: 'medical_services', dental: 'medical_services',
    pharmacy: 'medication', medicine: 'medication', therapy: 'psychology', mental: 'psychology',
    vision: 'visibility', health: 'favorite', hospital: 'local_hospital', spa: 'spa',
    yoga: 'self_improvement', swimming: 'pool', supplements: 'medication',
    tuition: 'school', school: 'school', college: 'school', university: 'school',
    courses: 'menu_book', textbooks: 'auto_stories', training: 'school', certification: 'verified',
    'class room': 'school', classroom: 'school', education: 'school', learning: 'menu_book',
    webinars: 'laptop', webinar: 'laptop', tutorials: 'play_circle',
    savings: 'savings', investment: 'trending_up', investing: 'trending_up', stocks: 'candlestick_chart',
    retirement: 'elderly', '401k': 'savings', ira: 'savings', 'credit card': 'credit_card',
    bank: 'account_balance', fees: 'receipt', 'bank fees': 'account_balance', taxes: 'receipt_long',
    tax: 'receipt_long', interest: 'percent', loan: 'payments', debt: 'payments',
    office: 'business_center', supplies: 'inventory_2', tools: 'handyman',
    software: 'laptop', coworking: 'meeting_room', business: 'business_center',
    professional: 'work', freelance: 'laptop',
    kids: 'child_care', children: 'child_care', childcare: 'child_care', daycare: 'child_care',
    baby: 'child_friendly', pets: 'pets', pet: 'pets', dog: 'pets', cat: 'pets', vet: 'pets',
    family: 'diversity_3', personal: 'face', grooming: 'face', haircut: 'face',
    insurance: 'shield', 'home insurance': 'shield', 'health insurance': 'health_and_safety',
    'life insurance': 'shield', legal: 'gavel', lawyer: 'gavel',
    vacation: 'flight', travel: 'flight', hotel: 'hotel', airfare: 'flight', flights: 'flight',
    lodging: 'hotel', camping: 'hiking', beach: 'beach_access',
    soccer: 'sports_soccer', football: 'sports_football', basketball: 'sports_basketball',
    tennis: 'sports_tennis', golf: 'sports_golf', baseball: 'sports_baseball',
    cricket: 'sports_cricket', hockey: 'sports_hockey', rugby: 'sports_rugby',
    volleyball: 'sports_volleyball', martial: 'sports_martial_arts', boxing: 'sports_mma',
    skiing: 'downhill_skiing', snowboard: 'snowboarding', surf: 'surfing', skateboard: 'skateboarding',
    salary: 'payments', paycheck: 'payments', wage: 'payments', bonus: 'card_giftcard',
    dividend: 'trending_up', dividends: 'trending_up',
    'side hustle': 'work', refund: 'replay', cashback: 'replay',
    rental: 'real_estate_agent', 'rental income': 'real_estate_agent',
    miscellaneous: 'more_horiz', other: 'more_horiz', misc: 'more_horiz',
    charity: 'volunteer_activism', donation: 'volunteer_activism', donations: 'volunteer_activism',
    church: 'volunteer_activism', tithe: 'volunteer_activism', tithing: 'volunteer_activism',
  };

  inferIcon(name: string, fallbackIcon: string | null, defaultIcon: string): string {
    if (fallbackIcon && fallbackIcon !== 'category' && fallbackIcon !== 'label') return fallbackIcon;
    const key = name.toLowerCase().trim();
    if (CategoryPageComponent.ICON_MAP[key]) return CategoryPageComponent.ICON_MAP[key];
    for (const [keyword, icon] of Object.entries(CategoryPageComponent.ICON_MAP)) {
      if (key.includes(keyword) || keyword.includes(key)) return icon;
    }
    return fallbackIcon || defaultIcon;
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
