import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'localDate', standalone: true })
export class LocalDatePipe implements PipeTransform {
  transform(value: string | null | undefined, format: string = 'mediumDate'): string {
    if (!value) return '';
    const parts = value.split('T')[0].split('-');
    const year = +parts[0];
    const month = +parts[1];
    const day = +parts[2];
    const d = new Date(year, month - 1, day);

    switch (format) {
      case 'M/d':
        return `${month}/${day}`;
      case 'MMM d':
        return `${this.monthShort(month)} ${day}`;
      case 'MMM d, y':
      case 'MMM d, yyyy':
        return `${this.monthShort(month)} ${day}, ${year}`;
      case 'MMM yyyy':
      case 'MMM y':
        return `${this.monthShort(month)} ${year}`;
      case 'mediumDate':
        return `${this.monthShort(month)} ${day}, ${year}`;
      case 'EEEE, MMM d':
        return `${this.dayFull(d.getDay())}, ${this.monthShort(month)} ${day}`;
      case 'EEEE, MMM d, y':
        return `${this.dayFull(d.getDay())}, ${this.monthShort(month)} ${day}, ${year}`;
      case 'EEE, MMM d':
        return `${this.dayShort(d.getDay())}, ${this.monthShort(month)} ${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  }

  private monthShort(m: number): string {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
  }

  private dayFull(d: number): string {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d];
  }

  private dayShort(d: number): string {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d];
  }
}
