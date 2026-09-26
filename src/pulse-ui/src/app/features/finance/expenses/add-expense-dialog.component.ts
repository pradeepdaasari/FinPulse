import { Component, computed, inject, OnInit, signal, ChangeDetectorRef, afterNextRender, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DailyExpense, DailyExpenseCreate, TransactionType, FundingSourceType } from '../../../core/models/daily-expense.model';
import { PaymentHistory } from '../../../core/models/payment-history.model';
import { toLocalISOString } from '../../../core/utils/date-utils';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { DailyExpenseService } from '../../../core/services/daily-expense.service';
import { FundingSourceService } from '../../../core/services/funding-source.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { PaymentService } from '../../../core/services/payment.service';
import { DebtService } from '../../../core/services/debt.service';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { DebtItem } from '../../../core/models/debt-item.model';
import { NotificationService } from '../../../core/services/notification.service';
import { FundingSource } from '../../../core/models/funding-source.model';

export interface ExpenseDialogData {
  expense: DailyExpense | null;
  prefilledCategoryId?: number;
  prefill?: Partial<DailyExpense>;
  preselectedType?: string;
  preselectedDebtKey?: string;
  returnPayload?: boolean;
  existingPayment?: PaymentHistory;
}

@Component({
  selector: 'app-add-expense-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatAutocompleteModule, MatProgressSpinnerModule, MatSlideToggleModule, MatTooltipModule
  ],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>receipt_long</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ data?.existingPayment ? 'Edit Payment' : data?.expense ? 'Edit' : 'Log' }} Transaction</h2>
          <p class="dialog-subtitle">{{ data?.existingPayment ? 'Update payment details' : 'Track every dollar, build better habits' }}</p>
        </div>
        <span class="banner-spacer"></span>
        <div class="dialog-header-actions">
          @if (data?.expense || data?.existingPayment) {
            <button mat-icon-button class="header-delete" (click)="confirmDelete()" matTooltip="Delete">
              <mat-icon>delete_outline</mat-icon>
            </button>
          }
          <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="expense-form" (submit)="$event.preventDefault()">
        <div class="txn-icons">
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Expense'" (click)="form.patchValue({transactionType: 'Expense'})">
            <div class="txn-circle expense"><mat-icon>remove_circle_outline</mat-icon></div>
            <span class="txn-label">Expense</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Income'" (click)="form.patchValue({transactionType: 'Income'})">
            <div class="txn-circle income"><mat-icon>add</mat-icon></div>
            <span class="txn-label">Income</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Transfer'" (click)="form.patchValue({transactionType: 'Transfer'})">
            <div class="txn-circle transfer"><mat-icon>swap_horiz</mat-icon></div>
            <span class="txn-label">Transfer</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Refund'" (click)="form.patchValue({transactionType: 'Refund'})">
            <div class="txn-circle refund"><mat-icon>undo</mat-icon></div>
            <span class="txn-label">Refund</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'CardPayment'" (click)="form.patchValue({transactionType: 'CardPayment'})">
            <div class="txn-circle card"><mat-icon>credit_card</mat-icon></div>
            <span class="txn-label">Card Pay</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'LoanPayment'" (click)="form.patchValue({transactionType: 'LoanPayment'})">
            <div class="txn-circle loan"><mat-icon>account_balance</mat-icon></div>
            <span class="txn-label">Loan Pay</span>
          </div>
        </div>

        <!-- Hero Amount — front and center for standard types -->
        @if (form.value.transactionType !== 'LoanPayment' && form.value.transactionType !== 'CardPayment') {
          <div class="amount-hero">
            <div class="amount-input-row">
              <span class="amount-dollar">$</span>
              <input class="amount-value" type="number" inputmode="decimal" formControlName="amount" min="0.01" step="0.01" placeholder="0.00" #amountInput cdkFocusInitial>
            </div>
            <div class="amount-underline"></div>
          </div>
        }

        <!-- Compact date + time row -->
        <div class="date-time-compact">
          <mat-icon class="dtc-icon">calendar_today</mat-icon>
          <div class="dtc-date-wrap" (click)="picker.open()">
            <input matInput [matDatepicker]="picker" formControlName="date" class="dtc-date-input" readonly>
            <mat-datepicker #picker></mat-datepicker>
          </div>
          <span class="dtc-sep">|</span>
          <mat-icon class="dtc-icon" (click)="expTimeInput.showPicker()">schedule</mat-icon>
          <input #expTimeInput type="time" formControlName="time" class="dtc-time-input" (click)="expTimeInput.showPicker()">
        </div>

        @if (form.value.transactionType !== 'Transfer' && form.value.transactionType !== 'CardPayment' && form.value.transactionType !== 'LoanPayment') {
          <div class="category-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Category</mat-label>
              <input matInput
                     [formControl]="categoryInputCtrl"
                     [matAutocomplete]="catAuto"
                     (blur)="onCategoryBlur()"
                     placeholder="Type to search...">
              <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
              <mat-autocomplete #catAuto="matAutocomplete"
                                [displayWith]="displayCategory"
                                (optionSelected)="onCategorySelected($event)"
                                class="category-autocomplete">
                @for (parent of filteredCategories(); track parent.id; let pi = $index) {
                  <mat-optgroup [label]="parent.name">
                    @for (child of parent.children; track child.id) {
                      <mat-option [value]="child.id">
                        <span class="cat-opt">
                          <span class="cat-opt-icon" [style.background]="getCatColor(pi, 0.1)" [style.color]="getCatColor(pi, 1)">
                            <mat-icon>{{ child.icon || 'label' }}</mat-icon>
                          </span>
                          {{ child.name }}
                        </span>
                      </mat-option>
                    }
                    @if (!parent.children || parent.children.length === 0) {
                      <mat-option [value]="parent.id">
                        <span class="cat-opt">
                          <span class="cat-opt-icon" [style.background]="getCatColor(pi, 0.1)" [style.color]="getCatColor(pi, 1)">
                            <mat-icon>{{ parent.icon || 'label' }}</mat-icon>
                          </span>
                          {{ parent.name }}
                        </span>
                      </mat-option>
                    }
                  </mat-optgroup>
                }
              </mat-autocomplete>
            </mat-form-field>
            <button mat-icon-button type="button" class="add-cat-icon" (click)="showNewCategory.set(!showNewCategory())" [color]="showNewCategory() ? 'warn' : 'primary'">
              <mat-icon>{{ showNewCategory() ? 'close' : 'add' }}</mat-icon>
            </button>
          </div>

          @if (showNewCategory()) {
            <div class="new-category-row">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>New Category Name</mat-label>
                <input matInput formControlName="newCategoryName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Under</mat-label>
                <mat-select formControlName="newCategoryParent">
                  @for (parent of categories(); track parent.id) {
                    <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-icon-button color="primary" (click)="createCategory()" type="button">
                <mat-icon>check</mat-icon>
              </button>
            </div>
          }
        }

        @if (form.value.transactionType === 'Transfer') {
          <mat-form-field appearance="outline">
            <mat-label>From Account</mat-label>
            <input matInput [formControl]="fromAcctInputCtrl" [matAutocomplete]="fromAcctAuto" (blur)="onFromAcctBlur()" placeholder="Type to search...">
            <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
            <mat-autocomplete #fromAcctAuto="matAutocomplete" [displayWith]="displayBankAccount" (optionSelected)="onFromAcctSelected($event)">
              @for (source of filteredBankSources(); track source.id) {
                <mat-option [value]="'BankAccount:' + source.id">
                  <mat-icon>account_balance</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>To Account</mat-label>
            <input matInput [formControl]="toAcctInputCtrl" [matAutocomplete]="toAcctAuto" (blur)="onToAcctBlur()" placeholder="Type to search...">
            <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
            <mat-autocomplete #toAcctAuto="matAutocomplete" [displayWith]="displayBankAccount" (optionSelected)="onToAcctSelected($event)">
              @for (source of filteredBankSources(); track source.id) {
                <mat-option [value]="'BankAccount:' + source.id">
                  <mat-icon>account_balance</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
        } @else if (form.value.transactionType === 'CardPayment') {
          <mat-form-field appearance="outline">
            <mat-label>Select Credit Card</mat-label>
            <input matInput [formControl]="cardInputCtrl" [matAutocomplete]="cardAuto" (blur)="onCardBlur()" placeholder="Type to search...">
            <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
            <mat-autocomplete #cardAuto="matAutocomplete" [displayWith]="displayDebt" (optionSelected)="onCardSelected($event)">
              @for (debt of cardDebts(); track debt.key) {
                <mat-option [value]="debt.key">
                  <mat-icon>credit_card</mat-icon>
                  {{ debt.name }} — {{ debt.currentBalance | currency }} bal
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          @if (selectedDebt()) {
            <div class="debt-info-card">
              <div class="debt-info-row">
                <span class="debt-info-label">Balance</span>
                <span class="debt-info-value">{{ selectedDebt()!.currentBalance | currency }}</span>
              </div>
              <div class="debt-info-row">
                <span class="debt-info-label">APR</span>
                <span class="debt-info-value">{{ selectedDebt()!.aprPercent }}%</span>
              </div>
              <div class="debt-info-row">
                <span class="debt-info-label">Due Day</span>
                <span class="debt-info-value">{{ selectedDebt()!.dueDay }}th of month</span>
              </div>
            </div>

            <div class="pay-mode-row">
              <div class="pay-mode-chip" [class.active]="loanPaymentMode() === 'full'" (click)="onLoanPaymentModeChange('full')">
                <span class="pmc-label">Full</span>
                <span class="pmc-value">{{ selectedDebt()!.monthlyPayment | currency }}</span>
              </div>
              <div class="pay-mode-chip" [class.active]="loanPaymentMode() === 'minimum'" (click)="onLoanPaymentModeChange('minimum')">
                <span class="pmc-label">Minimum</span>
                <span class="pmc-value">{{ getMinPayment(selectedDebt()!) | currency }}</span>
              </div>
              <div class="pay-mode-chip" [class.active]="loanPaymentMode() === 'custom'" (click)="onLoanPaymentModeChange('custom')">
                <span class="pmc-label">Custom</span>
              </div>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Payment Amount</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="amount" min="0.01" step="0.01">
              <span matTextPrefix>$&nbsp;</span>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>From Account</mat-label>
              <input matInput [formControl]="fromAcctInputCtrl" [matAutocomplete]="fromAcctAutoCard" (blur)="onFromAcctBlur()" placeholder="Type to search...">
              <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
              <mat-autocomplete #fromAcctAutoCard="matAutocomplete" [displayWith]="displayBankAccount" (optionSelected)="onFromAcctSelected($event)">
                @for (source of filteredBankSources(); track source.id) {
                  <mat-option [value]="'BankAccount:' + source.id">
                    <mat-icon>account_balance</mat-icon>
                    {{ source.name }} ({{ source.currentBalance | currency }})
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          }
        } @else if (form.value.transactionType === 'LoanPayment') {
          <mat-form-field appearance="outline">
            <mat-label>Select Loan Account</mat-label>
            <input matInput [formControl]="loanInputCtrl" [matAutocomplete]="loanAuto" (blur)="onLoanBlur()" placeholder="Type to search...">
            <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
            <mat-autocomplete #loanAuto="matAutocomplete" [displayWith]="displayDebt" (optionSelected)="onLoanSelected($event)">
              @for (debt of loanDebts(); track debt.key) {
                <mat-option [value]="debt.key">
                  <mat-icon>account_balance</mat-icon>
                  {{ debt.name }} — {{ debt.currentBalance | currency }} bal
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          @if (selectedDebt()) {
            <div class="debt-info-card">
              <div class="debt-info-row">
                <span class="debt-info-label">Balance</span>
                <span class="debt-info-value">{{ selectedDebt()!.currentBalance | currency }}</span>
              </div>
              <div class="debt-info-row">
                <span class="debt-info-label">APR</span>
                <span class="debt-info-value">{{ selectedDebt()!.aprPercent }}%</span>
              </div>
              <div class="debt-info-row">
                <span class="debt-info-label">Due Day</span>
                <span class="debt-info-value">{{ selectedDebt()!.dueDay }}th of month</span>
              </div>
            </div>

            <div class="pay-mode-row">
              <div class="pay-mode-chip" [class.active]="loanPaymentMode() === 'full'" (click)="onLoanPaymentModeChange('full')">
                <span class="pmc-label">Full</span>
                <span class="pmc-value">{{ selectedDebt()!.monthlyPayment | currency }}</span>
              </div>
              <div class="pay-mode-chip" [class.active]="loanPaymentMode() === 'minimum'" (click)="onLoanPaymentModeChange('minimum')">
                <span class="pmc-label">Minimum</span>
                <span class="pmc-value">{{ getMinPayment(selectedDebt()!) | currency }}</span>
              </div>
              <div class="pay-mode-chip" [class.active]="loanPaymentMode() === 'custom'" (click)="onLoanPaymentModeChange('custom')">
                <span class="pmc-label">Custom</span>
              </div>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Payment Amount</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="amount" min="0.01" step="0.01">
              <span matTextPrefix>$&nbsp;</span>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>From Account</mat-label>
              <input matInput [formControl]="fromAcctInputCtrl" [matAutocomplete]="fromAcctAutoLoan" (blur)="onFromAcctBlur()" placeholder="Type to search...">
              <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
              <mat-autocomplete #fromAcctAutoLoan="matAutocomplete" [displayWith]="displayBankAccount" (optionSelected)="onFromAcctSelected($event)">
                @for (source of filteredBankSources(); track source.id) {
                  <mat-option [value]="'BankAccount:' + source.id">
                    <mat-icon>account_balance</mat-icon>
                    {{ source.name }} ({{ source.currentBalance | currency }})
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          }
        } @else {
          <mat-form-field appearance="outline">
            <mat-label>{{ form.value.transactionType === 'Income' ? 'Received into' : form.value.transactionType === 'Refund' ? 'Refunded to' : 'Paid with' }}</mat-label>
            <input matInput [formControl]="sourceInputCtrl" [matAutocomplete]="sourceAuto" (blur)="onSourceBlur()" placeholder="Type to search...">
            <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
            <mat-autocomplete #sourceAuto="matAutocomplete" [displayWith]="displaySource" (optionSelected)="onSourceSelected($event)">
              @for (source of filteredSourcesSearched(); track source.type + source.id) {
                <mat-option [value]="source.type + ':' + source.id">
                  <mat-icon>{{ source.type === 'BankAccount' ? 'account_balance' : 'credit_card' }}</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
        }

        <!-- Two-column: Paid with + Merchant for standard types -->
        @if (form.value.transactionType !== 'Transfer' && form.value.transactionType !== 'CardPayment' && form.value.transactionType !== 'LoanPayment') {
          <div class="two-col-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Merchant</mat-label>
              <input matInput formControlName="merchant" [matAutocomplete]="merchantAuto"
                     (input)="filterMerchants($event)" (focus)="onMerchantFocus()"
                     placeholder="e.g. Walmart">
              <mat-icon matSuffix class="merchant-search-icon">search</mat-icon>
              <mat-autocomplete #merchantAuto="matAutocomplete">
                @for (merchant of filteredMerchants(); track merchant) {
                  <mat-option [value]="merchant">{{ merchant }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
        }

        <mat-form-field appearance="outline">
          <mat-label>{{ form.value.transactionType === 'Transfer' ? 'e.g. Fund brokerage account' : 'What was this for?' }}</mat-label>
          <input matInput formControlName="description" [matAutocomplete]="descAuto"
                 (input)="onDescriptionInput()">
          <mat-autocomplete #descAuto="matAutocomplete">
            @for (desc of filteredDescriptions(); track desc) {
              <mat-option [value]="desc">{{ desc }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <!-- More Options — progressive disclosure for tags and split -->
        <div class="more-options-toggle" (click)="showMoreOptions.set(!showMoreOptions())">
          <mat-icon class="more-icon">{{ showMoreOptions() ? 'expand_less' : 'expand_more' }}</mat-icon>
          <span>More options (Tag, Split)</span>
        </div>

        @if (showMoreOptions()) {
          <div class="more-options-section">
            <mat-form-field appearance="outline">
              <mat-label>Tag (optional)</mat-label>
              <input matInput formControlName="tag" [matAutocomplete]="tagAutoDialog"
                     placeholder="e.g. Hawaii 2026" (input)="onTagDialogInput()">
              <mat-icon matPrefix>label</mat-icon>
              <mat-autocomplete #tagAutoDialog="matAutocomplete">
                @for (t of filteredTagOptions(); track t) {
                  <mat-option [value]="t">{{ t }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tag Type (optional)</mat-label>
              <input matInput [formControl]="tagTypeInputCtrl" [matAutocomplete]="tagTypeAuto" (blur)="onTagTypeBlur()" placeholder="Type to search...">
              <mat-icon matPrefix>category</mat-icon>
              <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
              <mat-autocomplete #tagTypeAuto="matAutocomplete" [displayWith]="displayTagType" (optionSelected)="onTagTypeAutoSelected($event)">
                <mat-option [value]="''">-- None --</mat-option>
                @for (tt of filteredTagTypes(); track tt) {
                  <mat-option [value]="tt">{{ tt }}</mat-option>
                }
                <mat-option value="__other__">+ New tag type...</mat-option>
              </mat-autocomplete>
            </mat-form-field>
            @if (form.value.tagType === '__other__') {
              <mat-form-field appearance="outline">
                <mat-label>New Tag Type</mat-label>
                <input matInput formControlName="customTagType" placeholder="Enter new tag type" (input)="customTagTypeValue.set($any($event.target).value)">
                <mat-icon matPrefix>edit</mat-icon>
                @if (isTagTypeDuplicate()) {
                  <mat-hint class="warn-hint">This tag type already exists — select it from the dropdown instead.</mat-hint>
                }
              </mat-form-field>
            }

            @if (!data?.expense && form.value.transactionType === 'Expense') {
              <mat-slide-toggle [checked]="splitMode()" (change)="splitMode() ? splitMode.set(false) : enableSplit()" class="split-toggle">
                Split across categories
              </mat-slide-toggle>
            }
          </div>
        }
      </form>
    @if (splitMode()) {
      <div class="split-section">
        <div class="split-header">
          <span class="split-title">Split across categories</span>
          <span class="split-total" [class.split-valid]="splitTotalValid()" [class.split-invalid]="!splitTotalValid()">
            Total: {{ splitTotal() | currency }} / {{ form.value.amount | currency }}
          </span>
        </div>
        @for (row of splitRows.controls; track $index) {
          <div class="split-row" [formGroup]="$any(row)">
            <mat-form-field appearance="outline" class="split-cat">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                @for (parent of categories(); track parent.id) {
                  <mat-optgroup [label]="parent.name">
                    @for (child of parent.children; track child.id) {
                      <mat-option [value]="child.id">{{ child.name }}</mat-option>
                    }
                    @if (!parent.children || parent.children.length === 0) {
                      <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
                    }
                  </mat-optgroup>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="split-amt">
              <mat-label>Amount</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="amount" min="0.01" step="0.01">
              <span matTextPrefix>$&nbsp;</span>
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="removeSplitRow($index)" type="button" [disabled]="splitRows.length <= 2">
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>
        }
        <button mat-button type="button" (click)="addSplitRow()">
          <mat-icon>add</mat-icon> Add Row
        </button>
      </div>
    }
    }
    </mat-dialog-content>

    <div class="sticky-save-bar">
      <button class="gradient-save-btn" (click)="save()" [disabled]="form.invalid || loading() || saving() || savingLoanPayment() || (splitMode() && !splitTotalValid()) || ((form.value.transactionType === 'LoanPayment' || form.value.transactionType === 'CardPayment') && !selectedDebt())">
        @if (saving() || savingLoanPayment()) {
          <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
          Saving...
        } @else {
          <mat-icon>check</mat-icon>
          {{ data?.existingPayment ? 'Update Payment' : data?.expense ? 'Update Transaction' : 'Save Transaction' }}
        }
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative;
      padding: 18px 24px;
      background: var(--gradient-primary);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .dialog-header-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
    }
    .dialog-header-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #fff;
    }
    h2[mat-dialog-title] {
      margin: 0 !important;
      padding: 0 !important;
      font-size: 1rem !important;
      font-weight: 700 !important;
      letter-spacing: var(--tracking-tight);
      color: #fff !important;
    }
    .dialog-subtitle {
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.72rem;
      margin: 2px 0 0;
    }
    .banner-spacer { flex: 1; }
    .dialog-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      align-self: center;
    }
    .header-delete, .header-close {
      color: rgba(255, 255, 255, 0.9) !important;
      width: 40px !important;
      height: 40px !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(255, 255, 255, 0.12) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
    .header-delete:hover { background: rgba(255, 80, 80, 0.3) !important; }
    .header-close:hover { background: rgba(255, 255, 255, 0.25) !important; }
    .header-delete mat-icon, .header-close mat-icon {
      font-size: 20px; width: 20px; height: 20px;
    }
    /* Hero Amount */
    .amount-hero {
      text-align: center;
      padding: 8px 0 4px;
    }
    .amount-input-row {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 2px;
    }
    .amount-dollar {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-muted);
    }
    .amount-value {
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--color-text);
      font-variant-numeric: tabular-nums;
      border: none;
      background: none;
      text-align: center;
      width: 180px;
      outline: none;
      caret-color: var(--color-primary);
      -moz-appearance: textfield;
    }
    .amount-value::-webkit-inner-spin-button,
    .amount-value::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    .amount-value::placeholder { color: var(--color-text-muted); opacity: 0.4; }
    .amount-underline {
      width: 180px;
      height: 3px;
      border-radius: 2px;
      background: var(--gradient-primary);
      margin: 4px auto 0;
      opacity: 0.4;
    }

    /* Compact date/time row */
    .date-time-compact {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      background: var(--color-surface-secondary);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      margin-bottom: 8px;
      width: 100%; box-sizing: border-box;
    }
    .dtc-icon { color: var(--color-primary); font-size: 24px; width: 24px; height: 24px; flex-shrink: 0; }
    .dtc-date-wrap { cursor: pointer; flex-shrink: 0; }
    .dtc-date-input {
      border: none; background: none; outline: none;
      font-size: 1.05rem; font-weight: 600; color: var(--color-primary);
      cursor: pointer; width: 105px;
      font-family: inherit;
    }
    .dtc-sep { color: var(--color-border); font-weight: 300; flex-shrink: 0; font-size: 1.2rem; }
    .dtc-time-input {
      border: none; background: none; outline: none;
      font-size: 1.05rem; font-weight: 600; color: var(--color-text-secondary);
      width: auto; min-width: 60px; flex-shrink: 0;
      font-family: inherit;
    }
    .dtc-time-input::-webkit-calendar-picker-indicator { display: none; -webkit-appearance: none; }

    /* Two-col row */
    .two-col-row { display: flex; gap: 8px; }
    .two-col-row .flex-1 { flex: 1; }

    /* More options toggle */
    .more-options-toggle {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600; color: var(--color-primary);
      cursor: pointer; padding: 4px 0; margin-top: -4px;
      -webkit-tap-highlight-color: transparent;
    }
    .more-options-toggle:active { opacity: 0.7; }
    .more-icon { font-size: 18px; width: 18px; height: 18px; }
    .more-options-section {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px 14px;
      background: color-mix(in srgb, var(--color-primary) 3%, var(--color-surface));
      border-radius: var(--radius-sm);
      border: 1px dashed color-mix(in srgb, var(--color-primary) 15%, transparent);
    }

    /* Sticky save bar */
    .sticky-save-bar {
      position: sticky;
      bottom: 0;
      padding: 12px 24px 16px;
      background: linear-gradient(transparent, var(--color-surface) 30%);
      z-index: 10;
    }
    .gradient-save-btn {
      width: 100%;
      height: 48px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--gradient-primary);
      color: #fff;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary) 30%, transparent);
      transition: opacity 0.15s, transform 0.1s;
      font-family: inherit;
    }
    .gradient-save-btn:disabled { opacity: 0.4; cursor: default; }
    .gradient-save-btn:not(:disabled):active { transform: scale(0.98); }
    .gradient-save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .expense-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      width: 100%;
    }
    .txn-icons {
      display: flex; justify-content: space-between;
      gap: 8px; margin-bottom: 12px;
    }
    .txn-icon-item {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      cursor: pointer; flex: 1; min-width: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .txn-icon-item:active .txn-circle { transform: scale(0.92); }
    .txn-circle {
      width: 52px; height: 52px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-surface-secondary);
      transition: all 0.2s ease;
    }
    .txn-circle mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .txn-label {
      font-size: 0.7rem; font-weight: 600;
      text-align: center; white-space: nowrap; transition: color 0.2s ease;
    }

    .txn-circle.expense { background: color-mix(in srgb, var(--color-danger) 10%, var(--color-surface-secondary)); }
    .txn-circle.expense mat-icon { color: color-mix(in srgb, var(--color-danger) 60%, var(--color-text-muted)); }
    .txn-circle.income { background: color-mix(in srgb, var(--color-success) 10%, var(--color-surface-secondary)); }
    .txn-circle.income mat-icon { color: color-mix(in srgb, var(--color-success) 60%, var(--color-text-muted)); }
    .txn-circle.transfer { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-secondary)); }
    .txn-circle.transfer mat-icon { color: color-mix(in srgb, var(--color-primary) 60%, var(--color-text-muted)); }
    .txn-circle.refund { background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface-secondary)); }
    .txn-circle.refund mat-icon { color: color-mix(in srgb, var(--color-warning) 60%, var(--color-text-muted)); }
    .txn-circle.card { background: color-mix(in srgb, var(--color-stat-purple) 10%, var(--color-surface-secondary)); }
    .txn-circle.card mat-icon { color: color-mix(in srgb, var(--color-stat-purple) 60%, var(--color-text-muted)); }
    .txn-circle.loan { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-secondary)); }
    .txn-circle.loan mat-icon { color: color-mix(in srgb, var(--color-primary) 60%, var(--color-text-muted)); }
    .txn-label { color: var(--color-text-secondary); }

    .txn-icon-item.active .txn-circle { transform: scale(1.1); }
    .txn-icon-item.active .txn-circle.expense {
      background: var(--color-stat-red-bg);
      box-shadow: 0 0 0 2.5px var(--color-danger), 0 3px 10px rgba(255, 59, 48, 0.2);
    }
    .txn-icon-item.active .txn-circle.expense mat-icon { color: var(--color-danger); }
    .txn-icon-item.active .txn-circle.income {
      background: var(--color-stat-green-bg);
      box-shadow: 0 0 0 2.5px var(--color-success), 0 3px 10px rgba(52, 199, 89, 0.2);
    }
    .txn-icon-item.active .txn-circle.income mat-icon { color: var(--color-success); }
    .txn-icon-item.active .txn-circle.transfer {
      background: var(--color-stat-blue-bg);
      box-shadow: 0 0 0 2.5px var(--color-primary), 0 3px 10px rgba(0, 122, 255, 0.2);
    }
    .txn-icon-item.active .txn-circle.transfer mat-icon { color: var(--color-primary); }
    .txn-icon-item.active .txn-circle.refund {
      background: var(--color-stat-amber-bg);
      box-shadow: 0 0 0 2.5px var(--color-warning), 0 3px 10px rgba(255, 149, 0, 0.2);
    }
    .txn-icon-item.active .txn-circle.refund mat-icon { color: var(--color-warning); }
    .txn-icon-item.active .txn-circle.card {
      background: var(--color-stat-purple-bg);
      box-shadow: 0 0 0 2.5px var(--color-stat-purple), 0 3px 10px rgba(175, 82, 222, 0.2);
    }
    .txn-icon-item.active .txn-circle.card mat-icon { color: var(--color-stat-purple); }
    .txn-icon-item.active .txn-circle.loan {
      background: var(--color-stat-blue-bg);
      box-shadow: 0 0 0 2.5px var(--color-primary), 0 3px 10px rgba(0, 122, 255, 0.2);
    }
    .txn-icon-item.active .txn-circle.loan mat-icon { color: var(--color-primary); }
    .txn-icon-item.active .txn-label { color: var(--color-text-primary); font-weight: 700; }
    .debt-info-card {
      background: var(--color-surface-secondary); border-radius: var(--radius-sm);
      padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;
      border: 1px solid var(--color-border); margin-bottom: 4px;
    }
    .debt-info-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.82rem;
    }
    .debt-info-label { color: var(--color-text-muted); font-weight: 500; }
    .debt-info-value { font-weight: 700; font-variant-numeric: tabular-nums; }
    .pay-mode-row { display: flex; gap: 8px; margin-bottom: 4px; }
    .pay-mode-chip {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 10px 8px; border-radius: var(--radius-sm);
      border: 2px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; transition: all 0.15s; -webkit-tap-highlight-color: transparent;
    }
    .pay-mode-chip:hover { border-color: var(--color-primary); }
    .pay-mode-chip.active {
      border-color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
    }
    .pmc-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-muted); }
    .pay-mode-chip.active .pmc-label { color: var(--color-primary); }
    .pmc-value { font-size: 0.92rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .category-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .add-cat-icon {
      margin-top: -8px;
    }
    .new-category-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .flex-1 { flex: 1; }
    .cat-arrow { color: var(--color-text-muted); cursor: pointer; }
    :host ::ng-deep .mat-mdc-form-field input.mat-mdc-input-element { outline: none; box-shadow: none; }
    .merchant-search-icon { color: var(--color-text-muted); font-size: 20px; width: 20px; height: 20px; }
    ::ng-deep .category-autocomplete .mat-mdc-option .mdc-list-item__primary-text {
      width: 100%;
    }
    .cat-opt {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
    }
    .cat-opt-icon {
      width: 30px; height: 30px; border-radius: 8px;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      text-align: center;
    }
    .cat-opt-icon mat-icon {
      font-size: 17px; width: 17px; height: 17px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto;
    }
    .category-search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      background: var(--color-surface);
      z-index: 100;
    }
    .category-search-box mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .category-search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; background: transparent; color: inherit; }
    .warn-hint { color: var(--color-warning) !important; }
    .split-section {
      border-top: 1px solid var(--color-border);
      padding-top: 14px;
      margin-top: 10px;
    }
    .split-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .split-title {
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .split-total {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-full);
    }
    .split-valid {
      color: var(--color-success);
      background: var(--color-stat-green-bg);
    }
    .split-invalid {
      color: var(--color-danger);
      background: var(--color-stat-red-bg);
    }
    .split-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .split-cat { flex: 2; }
    .split-amt { flex: 1; }

    .split-toggle {
      margin: 4px 0 8px;
      font-size: 0.85rem;
    }
    .btn-spinner { display: inline-block; margin-right: 6px; vertical-align: middle; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    @media (max-width: 1024px) {
      :host { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .dialog-banner { flex-shrink: 0; }
      .txn-icons { gap: 4px; }
      .txn-circle { width: 42px; height: 42px; }
      .txn-circle mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .txn-label { font-size: 0.65rem; }
      .txn-icon-item.active .txn-circle { transform: scale(1.05); }
    }
    @media (max-width: 599px) {
      .dialog-banner { padding: 14px 16px 12px; }
      .txn-icons {
        overflow-x: auto; justify-content: flex-start;
        gap: 6px; padding: 6px 4px 10px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .txn-icons::-webkit-scrollbar { display: none; }
      .txn-icon-item { flex: 0 0 auto; min-width: 58px; padding: 4px 4px; }
      .txn-circle { width: 46px; height: 46px; }
      .txn-circle mat-icon { font-size: 24px; width: 24px; height: 24px; }
      .txn-label { font-size: 0.68rem; }
      .amount-value { font-size: 2rem; width: 140px; }
      .amount-underline { width: 140px; }
      .two-col-row { flex-wrap: wrap; }
      .sticky-save-bar { padding: 10px 16px 14px; }
      .split-row { flex-wrap: wrap; }
    }
  `]
})
export class AddExpenseDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddExpenseDialogComponent>);
  private categoryService = inject(CategoryService);
  private expenseService = inject(DailyExpenseService);
  private fundingSourceService = inject(FundingSourceService);
  private merchantService = inject(MerchantService);
  private paymentService = inject(PaymentService);
  private debtService = inject(DebtService);
  private creditCardService = inject(CreditCardService);
  private notify = inject(NotificationService);
  data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);
  amountInput = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  constructor() {
    afterNextRender(() => {
      setTimeout(() => this.amountInput()?.nativeElement.focus(), 150);
    });
  }

  loading = signal(true);
  private loadCount = 0;
  categories = signal<Category[]>([]);
  categorySearch = signal('');
  categoryInputCtrl = new FormControl('');
  sourceInputCtrl = new FormControl('');
  fromAcctInputCtrl = new FormControl('');
  toAcctInputCtrl = new FormControl('');
  cardInputCtrl = new FormControl('');
  loanInputCtrl = new FormControl('');
  tagTypeInputCtrl = new FormControl('');

  displayCategory = (value: any): string => {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    for (const parent of this.categories()) {
      if (parent.id === value) return parent.name;
      for (const child of (parent.children || [])) {
        if (child.id === value) return child.name;
      }
    }
    return '';
  };

  onCategorySelected(event: any): void {
    this.form.patchValue({ categoryId: event.option.value });
    this.categorySearch.set('');
  }

  private catColorPalette = [
    '#1565c0', '#2e7d32', '#e65100', '#7b1fa2', '#00838f',
    '#c62828', '#4527a0', '#00695c', '#bf360c', '#283593'
  ];
  private catColorCache = new Map<number, string>();

  getCatColor(parentIndex: number, alpha: number): string {
    const parents = this.filteredCategories();
    const parent = parents[parentIndex];
    if (!parent) return alpha === 1 ? '#757575' : 'rgba(117,117,117,0.1)';
    if (!this.catColorCache.has(parent.id)) {
      let hash = 0;
      for (let i = 0; i < parent.name.length; i++) {
        hash = ((hash << 5) - hash) + parent.name.charCodeAt(i);
        hash |= 0;
      }
      this.catColorCache.set(parent.id, this.catColorPalette[Math.abs(hash) % this.catColorPalette.length]);
    }
    const hex = this.catColorCache.get(parent.id)!;
    if (alpha === 1) return hex;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  onCategoryBlur(): void {
    const currentId = this.form.value.categoryId;
    setTimeout(() => {
      if (currentId) {
        this.categoryInputCtrl.setValue(currentId as any, { emitEvent: false });
      } else {
        this.categoryInputCtrl.setValue('', { emitEvent: false });
      }
      this.categorySearch.set('');
    }, 200);
  }

  displaySource = (value: any): string => {
    if (!value) return '';
    const source = this.allSources().find(s => `${s.type}:${s.id}` === value);
    return source ? `${source.name} ($${source.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })})` : '';
  };
  displayBankAccount = (value: any): string => {
    if (!value) return '';
    const source = this.bankAccountSources().find(s => `BankAccount:${s.id}` === value);
    return source ? `${source.name} ($${source.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })})` : '';
  };
  displayDebt = (value: any): string => {
    if (!value) return '';
    const debt = this.debts().find(d => d.key === value);
    return debt ? `${debt.name} — $${debt.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} bal` : '';
  };
  displayTagType = (value: any): string => {
    if (!value || value === '') return '';
    if (value === '__other__') return '+ New tag type...';
    return value;
  };

  onSourceSelected(event: any): void {
    this.form.patchValue({ fundingSourceKey: event.option.value });
    this.sourceSearch.set('');
  }
  onSourceBlur(): void {
    setTimeout(() => {
      this.sourceInputCtrl.setValue(this.form.value.fundingSourceKey || '', { emitEvent: false });
      this.sourceSearch.set('');
    }, 200);
  }
  onFromAcctSelected(event: any): void {
    this.form.patchValue({ fundingSourceKey: event.option.value });
    this.bankSearch.set('');
  }
  onFromAcctBlur(): void {
    setTimeout(() => {
      this.fromAcctInputCtrl.setValue(this.form.value.fundingSourceKey || '', { emitEvent: false });
      this.bankSearch.set('');
    }, 200);
  }
  onToAcctSelected(event: any): void {
    this.form.patchValue({ toFundingSourceKey: event.option.value });
    this.bankSearch.set('');
  }
  onToAcctBlur(): void {
    setTimeout(() => {
      this.toAcctInputCtrl.setValue(this.form.value.toFundingSourceKey || '', { emitEvent: false });
      this.bankSearch.set('');
    }, 200);
  }
  onCardSelected(event: any): void {
    this.form.patchValue({ selectedDebtKey: event.option.value });
    this.onDebtSelected(event.option.value);
    this.cardSearch.set('');
  }
  onCardBlur(): void {
    setTimeout(() => {
      this.cardInputCtrl.setValue(this.form.value.selectedDebtKey || '', { emitEvent: false });
      this.cardSearch.set('');
    }, 200);
  }
  onLoanSelected(event: any): void {
    this.form.patchValue({ selectedDebtKey: event.option.value });
    this.onDebtSelected(event.option.value);
    this.loanSearch.set('');
  }
  onLoanBlur(): void {
    setTimeout(() => {
      this.loanInputCtrl.setValue(this.form.value.selectedDebtKey || '', { emitEvent: false });
      this.loanSearch.set('');
    }, 200);
  }
  onTagTypeAutoSelected(event: any): void {
    this.form.patchValue({ tagType: event.option.value });
    this.tagTypeSearch.set('');
  }
  onTagTypeBlur(): void {
    setTimeout(() => {
      this.tagTypeInputCtrl.setValue(this.form.value.tagType || '', { emitEvent: false });
      this.tagTypeSearch.set('');
    }, 200);
  }
  private isKeyPattern(val: string): boolean { return /^(BankAccount|CreditCard|PersonalLoan):\d+$/.test(val); }
  filteredCategories = computed(() => {
    const q = this.categorySearch().toLowerCase();
    if (!q) return this.categories();
    return this.categories()
      .map(parent => {
        const matchedChildren = (parent.children || []).filter(c => c.name.toLowerCase().includes(q));
        if (parent.name.toLowerCase().includes(q)) return parent;
        if (matchedChildren.length > 0) return { ...parent, children: matchedChildren };
        return null;
      })
      .filter(Boolean) as Category[];
  });
  debts = signal<DebtItem[]>([]);
  loanSearch = signal('');
  cardSearch = signal('');
  bankSearch = signal('');
  sourceSearch = signal('');
  loanDebts = computed(() => {
    const q = this.loanSearch().toLowerCase();
    const all = this.debts().filter(d => d.type === 'PersonalLoan');
    return q ? all.filter(d => d.name.toLowerCase().includes(q)) : all;
  });
  cardDebts = computed(() => {
    const q = this.cardSearch().toLowerCase();
    const all = this.debts().filter(d => d.type === 'CreditCard');
    return q ? all.filter(d => d.name.toLowerCase().includes(q)) : all;
  });
  filteredBankSources = computed(() => {
    const q = this.bankSearch().toLowerCase();
    return q ? this.bankAccountSources().filter(s => s.name.toLowerCase().includes(q)) : this.bankAccountSources();
  });
  filteredSourcesSearched = computed(() => {
    const q = this.sourceSearch().toLowerCase();
    return q ? this.filteredSources().filter(s => s.name.toLowerCase().includes(q)) : this.filteredSources();
  });
  selectedDebt = signal<DebtItem | null>(null);
  loanPaymentMode = signal<'full' | 'minimum' | 'custom'>(this.data?.existingPayment ? 'custom' : 'full');
  savingLoanPayment = signal(false);
  cardMinPayments = new Map<number, number>();
  private sourceUsageMap = new Map<string, number>();
  private categoryUsageMap = new Map<number, number>();
  allSources = signal<FundingSource[]>([]);
  filteredSources = signal<FundingSource[]>([]);
  bankAccountSources = signal<FundingSource[]>([]);
  creditCardSources = signal<FundingSource[]>([]);
  toAccountSources = signal<FundingSource[]>([]);
  showNewCategory = signal(false);
  allTagOptions = signal<string[]>([]);
  filteredTagOptions = signal<string[]>([]);
  tagTypes = signal<string[]>([]);
  tagTypeSearch = signal('');
  filteredTagTypes = computed(() => {
    const q = this.tagTypeSearch().toLowerCase();
    return q ? this.tagTypes().filter(t => t.toLowerCase().includes(q)) : this.tagTypes();
  });
  customTagTypeValue = signal('');
  isTagTypeDuplicate = computed(() => {
    const custom = this.customTagTypeValue().toLowerCase().trim();
    return custom.length > 0 && this.tagTypes().some(t => t.toLowerCase() === custom);
  });
  filteredDescriptions = signal<string[]>([]);
  private allDescriptions = signal<string[]>([]);
  filteredMerchants = signal<string[]>([]);
  splitMode = signal(false);
  showMoreOptions = signal(false);
  splitRows = this.fb.array<FormGroup>([]);
  splitTotal = signal(0);

  splitTotalValid(): boolean {
    const total = this.form.value.amount;
    return !!total && Math.abs(this.splitTotal() - total) < 0.01;
  }

  onTagDialogInput(): void {
    const q = (this.form.value.tag || '').toLowerCase();
    this.filteredTagOptions.set(this.allTagOptions().filter(t => t.toLowerCase().includes(q)));
  }

  filterMerchants(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredMerchants.set(this.merchantService.filter(value));
  }

  onMerchantFocus(): void {
    const current = this.form.value.merchant || '';
    this.filteredMerchants.set(this.merchantService.filter(current));
  }

  onDescriptionInput(): void {
    const q = (this.form.value.description || '').toLowerCase();
    if (!q) {
      this.filteredDescriptions.set(this.allDescriptions().slice(0, 10));
    } else {
      this.filteredDescriptions.set(this.allDescriptions().filter(d => d.toLowerCase().includes(q)).slice(0, 8));
    }
  }

  enableSplit(): void {
    this.splitMode.set(true);
    this.splitRows.clear();
    this.addSplitRow();
    this.addSplitRow();
  }

  addSplitRow(): void {
    this.splitRows.push(this.fb.group({
      categoryId: [null as number | null, Validators.required],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]]
    }) as any);
  }

  removeSplitRow(index: number): void {
    this.splitRows.removeAt(index);
    this.updateSplitTotal();
  }

  private updateSplitTotal(): void {
    const total = this.splitRows.controls.reduce((sum, row) => sum + ((row as FormGroup).value.amount || 0), 0);
    this.splitTotal.set(total);
  }

  private get source() { return this.data?.expense ?? this.data?.prefill ?? null; }

  private getTimeInUserTz(d: Date): string {
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const hh = parts.find(p => p.type === 'hour')!.value.padStart(2, '0');
    const mm = parts.find(p => p.type === 'minute')!.value.padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private getDateInUserTz(d: Date): Date {
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    const year = +parts.find(p => p.type === 'year')!.value;
    const month = +parts.find(p => p.type === 'month')!.value - 1;
    const day = +parts.find(p => p.type === 'day')!.value;
    return new Date(year, month, day);
  }

  private get paymentDate(): Date {
    return this.data?.existingPayment ? new Date(this.data.existingPayment.paymentDate) : new Date();
  }

  private get paymentFundingKey(): string | null {
    const p = this.data?.existingPayment;
    return p?.fromAccountId ? `BankAccount:${p.fromAccountId}` : null;
  }

  form = this.fb.group({
    transactionType: [(this.data?.preselectedType ?? this.source?.transactionType ?? 'Expense') as TransactionType, Validators.required],
    date: [this.data?.existingPayment ? this.getDateInUserTz(this.paymentDate) : this.data?.expense ? this.getDateInUserTz(new Date(this.data.expense.date)) : this.getDateInUserTz(new Date()), Validators.required],
    time: [this.data?.existingPayment ? this.getTimeInUserTz(this.paymentDate) : this.data?.expense ? this.getTimeInUserTz(new Date(this.data.expense.date)) : this.getTimeInUserTz(new Date()), Validators.required],
    categoryId: [this.source?.categoryId ?? this.data?.prefilledCategoryId ?? null as number | null],
    amount: [this.data?.existingPayment?.amountPaid ?? this.source?.amount ?? null as number | null, [Validators.required, Validators.min(0.01)]],
    merchant: [this.source?.merchant ?? '', Validators.required],
    description: [this.data?.existingPayment?.notes ?? this.source?.description ?? '', [Validators.required, Validators.maxLength(500)]],
    fundingSourceKey: [this.paymentFundingKey ?? this.buildSourceKey(this.source as DailyExpense | null) as string | null, Validators.required],
    toFundingSourceKey: [this.buildToSourceKey(this.source as DailyExpense | null) as string | null],
    tag: [this.source?.tag ?? ''],
    tagType: [this.source?.tagType ?? ''],
    customTagType: [''],
    newCategoryName: [''],
    newCategoryParent: [null as number | null],
    selectedDebtKey: [this.data?.preselectedDebtKey ?? null as string | null]
  });

  private checkLoaded(): void {
    this.loadCount++;
    if (this.loadCount >= 3) {
      this.loading.set(false);
    }
  }

  ngOnInit(): void {
    this.categoryInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        this.categorySearch.set(val);
      }
    });
    this.sourceInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string' && !this.isKeyPattern(val)) this.sourceSearch.set(val);
    });
    this.fromAcctInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string' && !this.isKeyPattern(val)) this.bankSearch.set(val);
    });
    this.toAcctInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string' && !this.isKeyPattern(val)) this.bankSearch.set(val);
    });
    this.cardInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string' && !this.isKeyPattern(val)) this.cardSearch.set(val);
    });
    this.loanInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string' && !this.isKeyPattern(val)) this.loanSearch.set(val);
    });
    this.tagTypeInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string') this.tagTypeSearch.set(val);
    });

    if (this.source?.tag || this.source?.tagType) {
      this.showMoreOptions.set(true);
    }

    this.loadCategories();
    this.expenseService.getSourceUsage().subscribe(usage => {
      for (const u of usage) this.sourceUsageMap.set(`${u.type}:${u.id}`, u.count);
    });
    this.expenseService.getCategoryUsage().subscribe(usage => {
      for (const u of usage) this.categoryUsageMap.set(u.categoryId, u.count);
    });
    this.fundingSourceService.getAll().subscribe(sources => {
      this.allSources.set(sources);
      this.filterSources();
      this.checkLoaded();
      const fundingKey = this.form.value.fundingSourceKey;
      if (fundingKey) {
        const txnType = this.form.value.transactionType;
        if (txnType === 'Transfer' || txnType === 'CardPayment' || txnType === 'LoanPayment') {
          this.fromAcctInputCtrl.setValue(fundingKey, { emitEvent: false });
        } else {
          this.sourceInputCtrl.setValue(fundingKey, { emitEvent: false });
        }
      }
      const toKey = this.form.value.toFundingSourceKey;
      if (toKey) this.toAcctInputCtrl.setValue(toKey, { emitEvent: false });
      this.cdr.detectChanges();
    });
    this.expenseService.getTags().subscribe(tags => {
      this.allTagOptions.set(tags);
      this.filteredTagOptions.set(tags);
      this.checkLoaded();
      this.cdr.detectChanges();
    });
    this.expenseService.getTagTypes().subscribe(types => {
      this.tagTypes.set(types);
      this.checkLoaded();
      const initTag = this.form.value.tagType;
      if (initTag) this.tagTypeInputCtrl.setValue(initTag, { emitEvent: false });
      this.cdr.detectChanges();
    });
    this.merchantService.getMerchants().subscribe(merchants => {
      this.filteredMerchants.set(merchants.slice(0, 10));
      this.cdr.detectChanges();
    });
    this.expenseService.getDescriptions().subscribe(descs => {
      this.allDescriptions.set(descs);
      this.filteredDescriptions.set(descs.slice(0, 10));
      this.cdr.detectChanges();
    });

    this.debtService.getAll().subscribe(debts => {
      this.debts.set(debts.sort((a, b) => a.name.localeCompare(b.name)));
      if (this.data?.preselectedDebtKey) {
        this.form.patchValue({ selectedDebtKey: this.data.preselectedDebtKey });
        this.onDebtSelected(this.data.preselectedDebtKey, !!this.data.existingPayment);
        const txnType = this.form.value.transactionType;
        if (txnType === 'CardPayment') this.cardInputCtrl.setValue(this.data.preselectedDebtKey, { emitEvent: false });
        else if (txnType === 'LoanPayment') this.loanInputCtrl.setValue(this.data.preselectedDebtKey, { emitEvent: false });
      }
      this.cdr.detectChanges();
    });
    this.creditCardService.getAll().subscribe(cards => {
      for (const c of cards) this.cardMinPayments.set(Number(c.id), c.minimumPayment);
    });

    this.form.get('transactionType')!.valueChanges.subscribe((type) => {
      this.form.patchValue({ categoryId: null });
      this.categoryInputCtrl.setValue('', { emitEvent: false });
      this.sourceInputCtrl.setValue('', { emitEvent: false });
      this.fromAcctInputCtrl.setValue('', { emitEvent: false });
      this.toAcctInputCtrl.setValue('', { emitEvent: false });
      this.cardInputCtrl.setValue('', { emitEvent: false });
      this.loanInputCtrl.setValue('', { emitEvent: false });
      this.sourceSearch.set('');
      this.bankSearch.set('');
      this.cardSearch.set('');
      this.loanSearch.set('');
      this.loadCategories();
      this.filterSources();
      if (type === 'LoanPayment' || type === 'CardPayment') {
        this.selectedDebt.set(null);
        this.form.patchValue({ selectedDebtKey: null });
      }
      const merchantCtrl = this.form.get('merchant')!;
      const amountCtrl = this.form.get('amount')!;
      const descCtrl = this.form.get('description')!;
      if (type === 'Transfer' || type === 'CardPayment' || type === 'LoanPayment') {
        merchantCtrl.clearValidators();
      } else {
        merchantCtrl.setValidators(Validators.required);
      }
      if (type === 'CardPayment' || type === 'LoanPayment') {
        amountCtrl.clearValidators();
        descCtrl.clearValidators();
      } else {
        amountCtrl.setValidators([Validators.required, Validators.min(0.01)]);
        descCtrl.setValidators([Validators.required, Validators.maxLength(500)]);
      }
      merchantCtrl.updateValueAndValidity();
      amountCtrl.updateValueAndValidity();
      descCtrl.updateValueAndValidity();
    });

    const initialType = this.form.value.transactionType;
    if (initialType === 'Transfer' || initialType === 'CardPayment' || initialType === 'LoanPayment') {
      const merchantCtrl = this.form.get('merchant')!;
      merchantCtrl.clearValidators();
      merchantCtrl.updateValueAndValidity();
    }
    if (initialType === 'CardPayment' || initialType === 'LoanPayment') {
      this.form.get('amount')!.clearValidators();
      this.form.get('amount')!.updateValueAndValidity();
      this.form.get('description')!.clearValidators();
      this.form.get('description')!.updateValueAndValidity();
    }

    this.form.get('fundingSourceKey')!.valueChanges.subscribe(() => {
      this.updateToAccounts();
    });

    this.splitRows.valueChanges.subscribe(() => this.updateSplitTotal());
  }

  private loadCategories(): void {
    const type = this.form.value.transactionType === 'Income' ? 'Income' : 'Expense';
    this.categoryService.getAll(type).subscribe(cats => {
      const sorted = cats.map(parent => {
        const children = [...(parent.children || [])].sort((a, b) => {
          const aCount = this.categoryUsageMap.get(a.id) ?? 0;
          const bCount = this.categoryUsageMap.get(b.id) ?? 0;
          if (bCount !== aCount) return bCount - aCount;
          return a.name.localeCompare(b.name);
        });
        const totalUsage = children.reduce((sum, c) => sum + (this.categoryUsageMap.get(c.id) ?? 0), 0)
          + (this.categoryUsageMap.get(parent.id) ?? 0);
        return { ...parent, children, _totalUsage: totalUsage };
      }).sort((a, b) => {
        if (b._totalUsage !== a._totalUsage) return b._totalUsage - a._totalUsage;
        return a.name.localeCompare(b.name);
      });
      this.categories.set(sorted);
      const currentId = this.form.value.categoryId;
      if (currentId) {
        this.categoryInputCtrl.setValue(currentId as any, { emitEvent: false });
      }
      this.cdr.detectChanges();
    });
  }

  private sortByUsage = (a: FundingSource, b: FundingSource): number => {
    const aCount = this.sourceUsageMap.get(`${a.type}:${a.id}`) ?? 0;
    const bCount = this.sourceUsageMap.get(`${b.type}:${b.id}`) ?? 0;
    if (bCount !== aCount) return bCount - aCount;
    return a.name.localeCompare(b.name);
  };

  private filterSources(): void {
    const txnType = this.form.value.transactionType;
    const banks = this.allSources().filter(s => s.type === 'BankAccount').sort(this.sortByUsage);
    const cards = this.allSources().filter(s => s.type === 'CreditCard').sort(this.sortByUsage);
    this.bankAccountSources.set(banks);
    this.creditCardSources.set(cards);
    this.updateToAccounts();

    if (txnType === 'Income') {
      this.filteredSources.set(banks);
    } else {
      this.filteredSources.set([...this.allSources()].sort(this.sortByUsage));
    }
  }

  private updateToAccounts(): void {
    const fromKey = this.form.value.fundingSourceKey;
    let fromId: number | null = null;
    if (fromKey) {
      const parts = fromKey.split(':');
      fromId = parseInt(parts[1], 10);
    }
    this.toAccountSources.set(this.bankAccountSources().filter(s => s.id !== fromId));
  }

  private buildSourceKey(expense: DailyExpense | null | undefined): string | null {
    if (!expense?.fundingSourceType || !expense?.fundingSourceId) return null;
    return `${expense.fundingSourceType}:${expense.fundingSourceId}`;
  }

  private buildToSourceKey(expense: DailyExpense | null | undefined): string | null {
    if (!expense?.toFundingSourceId) return null;
    return `BankAccount:${expense.toFundingSourceId}`;
  }

  createCategory(): void {
    const name = this.form.value.newCategoryName?.trim();
    const parentId = this.form.value.newCategoryParent;
    if (!name) return;

    const type = this.form.value.transactionType === 'Income' ? 'Income' : 'Expense';
    this.categoryService.create({ name, isFixed: false, type, parentId: parentId ?? null })
      .subscribe(created => {
        this.loadCategories();
        this.form.patchValue({ categoryId: created.id, newCategoryName: '' });
        this.categoryInputCtrl.setValue(created.id as any, { emitEvent: false });
        this.showNewCategory.set(false);
        this.cdr.detectChanges();
      });
  }

  private saveLoanPayment(): void {
    const debt = this.selectedDebt();
    const amount = this.form.value.amount;
    const description = this.form.value.description || `Payment for ${debt?.name}`;
    if (!debt || !amount) return;

    const fundingKey = this.form.value.fundingSourceKey;
    let fromAccountId: number | null = null;
    if (fundingKey) {
      const [type, id] = fundingKey.split(':');
      if (type === 'BankAccount') fromAccountId = parseInt(id, 10);
    }

    this.savingLoanPayment.set(true);

    const existingPayment = this.data?.existingPayment;
    const request$ = existingPayment
      ? this.paymentService.update(existingPayment.id, {
          amountPaid: amount,
          paymentDate: toLocalISOString(this.buildDateTime()),
          notes: description || undefined,
          fromAccountId: fromAccountId ?? undefined
        })
      : this.paymentService.recordPayment(debt.type, debt.id, amount, description, this.buildDateTime(), fromAccountId);

    request$.subscribe({
      next: () => {
        this.savingLoanPayment.set(false);
        this.dialogRef.close({ loanPayment: true, debtName: debt.name, amount });
      },
      error: (err: any) => {
        this.savingLoanPayment.set(false);
        this.notify.error(err?.error?.message || err?.error?.error || 'Payment failed');
        this.cdr.detectChanges();
      }
    });
  }

  onDebtSelected(key: string, preserveAmount = false): void {
    const debt = this.debts().find(d => d.key === key) ?? null;
    this.selectedDebt.set(debt);
    if (debt && !preserveAmount) {
      this.loanPaymentMode.set('full');
      this.form.patchValue({ amount: debt.monthlyPayment });
    }
  }

  onLoanPaymentModeChange(mode: 'full' | 'minimum' | 'custom'): void {
    this.loanPaymentMode.set(mode);
    const debt = this.selectedDebt();
    if (!debt) return;
    if (mode === 'full') {
      this.form.patchValue({ amount: debt.monthlyPayment });
    } else if (mode === 'minimum') {
      const minPay = debt.type === 'CreditCard'
        ? (this.cardMinPayments.get(debt.id) ?? debt.monthlyPayment)
        : debt.monthlyPayment;
      this.form.patchValue({ amount: minPay });
    }
  }

  getMinPayment(debt: DebtItem): number {
    if (debt.type === 'CreditCard') return this.cardMinPayments.get(debt.id) ?? debt.monthlyPayment;
    return debt.monthlyPayment;
  }

  private buildDateTime(): Date {
    const val = this.form.value;
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const d = val.date instanceof Date ? val.date : new Date(val.date!);
    const [hh, mm] = (val.time || '00:00').split(':').map(Number);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(hh).padStart(2, '0');
    const minutes = String(mm).padStart(2, '0');
    // Interpret entered date+time as wall-clock time in user's timezone
    const naiveUtc = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(naiveUtc);
    const tzDate = new Date(Date.UTC(
      +tzParts.find(p => p.type === 'year')!.value,
      +tzParts.find(p => p.type === 'month')!.value - 1,
      +tzParts.find(p => p.type === 'day')!.value,
      +tzParts.find(p => p.type === 'hour')!.value,
      +tzParts.find(p => p.type === 'minute')!.value,
      +tzParts.find(p => p.type === 'second')!.value
    ));
    const offsetMs = naiveUtc.getTime() - tzDate.getTime();
    return new Date(naiveUtc.getTime() + offsetMs);
  }

  saving = signal(false);

  focusInput(el: HTMLInputElement): void {
    setTimeout(() => el.focus(), 0);
  }

  confirmDelete(): void {
    if (this.data?.existingPayment) {
      if (confirm('Delete this payment? Balances will be restored. This cannot be undone.')) {
        this.paymentService.delete(this.data.existingPayment.id).subscribe({
          next: () => this.dialogRef.close('delete'),
          error: (err: any) => this.notify.error(err?.error?.error || 'Failed to delete payment')
        });
      }
    } else if (confirm('Delete this transaction? This cannot be undone.')) {
      this.dialogRef.close('delete');
    }
  }

  save(): void {
    const val = this.form.value;
    const isTransfer = val.transactionType === 'Transfer';
    const isCardPayment = val.transactionType === 'CardPayment';
    const isLoanPayment = val.transactionType === 'LoanPayment';

    if (isLoanPayment || isCardPayment) {
      this.saveLoanPayment();
      return;
    }

    if (!isTransfer && !isCardPayment && !val.categoryId) return;
    if (!val.amount || !val.description) return;
    if ((isTransfer || isCardPayment) && (!val.fundingSourceKey || !val.toFundingSourceKey)) return;

    let fundingSourceType: FundingSourceType | null = null;
    let fundingSourceId: number | null = null;
    let toFundingSourceId: number | null = null;

    if (val.fundingSourceKey) {
      const [type, id] = val.fundingSourceKey.split(':');
      fundingSourceType = type as FundingSourceType;
      fundingSourceId = parseInt(id, 10);
    }

    if (isTransfer && val.toFundingSourceKey) {
      const [, id] = val.toFundingSourceKey.split(':');
      toFundingSourceId = parseInt(id, 10);
      fundingSourceType = 'BankAccount';
    }

    if (isCardPayment && val.toFundingSourceKey) {
      const [, id] = val.toFundingSourceKey.split(':');
      toFundingSourceId = parseInt(id, 10);
      fundingSourceType = 'BankAccount';
    }

    const resolvedTagType = val.tagType === '__other__' ? (val.customTagType || null) : (val.tagType || null);

    if (this.splitMode()) {
      const splits: DailyExpenseCreate[] = this.splitRows.controls.map(ctrl => {
        const row = (ctrl as FormGroup).value;
        return {
          date: toLocalISOString(this.buildDateTime()),
          categoryId: row.categoryId!,
          amount: row.amount!,
          merchant: val.merchant || null,
          description: val.description!,
          transactionType: 'Expense' as TransactionType,
          fundingSourceType,
          fundingSourceId,
          toFundingSourceId: null,
          tag: val.tag || null,
          tagType: val.tag ? resolvedTagType : null
        };
      });
      if (this.data?.returnPayload) {
        this.dialogRef.close({ splits });
        return;
      }
      this.saving.set(true);
      this.expenseService.createSplit(splits).subscribe({
        next: () => {
          this.merchantService.invalidateCache();
          this.dialogRef.close({ saved: true });
        },
        error: (err: any) => {
          this.saving.set(false);
          this.notify.error(err?.error?.message || 'Failed to save transaction');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    const expense: DailyExpenseCreate = {
      date: toLocalISOString(this.buildDateTime()),
      categoryId: val.categoryId || null,
      amount: val.amount!,
      merchant: (isTransfer || isCardPayment) ? null : (val.merchant || null),
      description: val.description!,
      transactionType: val.transactionType as TransactionType,
      fundingSourceType,
      fundingSourceId,
      toFundingSourceId,
      tag: val.tag || null,
      tagType: val.tag ? resolvedTagType : null
    };

    if (this.data?.returnPayload) {
      this.dialogRef.close(expense);
      return;
    }

    this.saving.set(true);
    const isEdit = !!this.data?.expense;
    const save$ = isEdit
      ? this.expenseService.update(this.data!.expense!.id, expense)
      : this.expenseService.create(expense);

    save$.subscribe({
      next: () => {
        this.merchantService.invalidateCache();
        this.dialogRef.close({ saved: true, isEdit });
      },
      error: (err: any) => {
        this.saving.set(false);
        this.notify.error(err?.error?.message || `Failed to ${isEdit ? 'update' : 'save'} transaction`);
        this.cdr.detectChanges();
      }
    });
  }
}
