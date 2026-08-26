import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const routeFadeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, position: 'absolute', width: '100%' })
    ], { optional: true }),
    query(':leave', [
      style({ opacity: 1, position: 'absolute', width: '100%' }),
      animate('150ms ease-out', style({ opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      animate('150ms ease-in', style({ opacity: 1 }))
    ], { optional: true })
  ])
]);
