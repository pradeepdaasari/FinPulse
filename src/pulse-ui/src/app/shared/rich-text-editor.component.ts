import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [QuillModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RichTextEditorComponent),
    multi: true
  }],
  template: `
    @if (label) { <label class="rte-label">{{ label }}</label> }
    <quill-editor
      [ngModel]="value"
      [placeholder]="placeholder"
      [modules]="modules"
      [styles]="editorStyles"
      theme="snow"
      format="html"
      (onContentChanged)="onEditorChange($event)">
    </quill-editor>
  `,
  styles: [`
    :host { display: block; margin-bottom: 12px; width: 100%; }
    :host ::ng-deep quill-editor { display: block; width: 100%; }
    :host ::ng-deep .ql-toolbar.ql-snow + .ql-container.ql-snow { width: 100%; }
    .rte-label {
      display: block; font-size: 0.82rem; font-weight: 500;
      color: var(--color-text-muted); margin-bottom: 6px;
    }
    :host ::ng-deep .ql-toolbar.ql-snow {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      background: var(--color-surface);
      padding: 4px 8px;
    }
    :host ::ng-deep .ql-container.ql-snow {
      border: 1px solid var(--color-border);
      border-top: none;
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      background: var(--color-surface);
      font-family: inherit;
      font-size: 0.9rem;
      color: var(--color-text);
    }
    :host ::ng-deep .ql-editor {
      min-height: 80px;
    }
    :host ::ng-deep .ql-editor.ql-blank::before {
      color: var(--color-text-muted);
      font-style: italic;
    }
    :host ::ng-deep .ql-snow .ql-stroke {
      stroke: var(--color-text-muted);
    }
    :host ::ng-deep .ql-snow .ql-fill {
      fill: var(--color-text-muted);
    }
    :host ::ng-deep .ql-snow .ql-picker-label {
      color: var(--color-text-muted);
    }
    :host ::ng-deep .ql-snow .ql-picker-options {
      background: var(--color-surface);
      border-color: var(--color-border);
    }
    :host ::ng-deep .ql-toolbar.ql-snow .ql-formats {
      margin-right: 8px;
    }
    @media (max-width: 599px) {
      :host ::ng-deep .ql-toolbar.ql-snow {
        padding: 3px 4px;
      }
      :host ::ng-deep .ql-toolbar.ql-snow .ql-formats {
        margin-right: 4px;
      }
      :host ::ng-deep .ql-snow .ql-picker-label {
        padding: 0 4px;
      }
    }
  `]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() label = '';
  @Input() height = '120px';

  value = '';
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  get editorStyles() {
    return { 'min-height': this.height };
  }

  onEditorChange(event: any): void {
    const html = event.html;
    this.value = html;
    this.onChange(html);
    this.onTouched();
  }

  writeValue(val: string): void {
    this.value = val || '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
