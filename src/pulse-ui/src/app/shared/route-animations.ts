import { trigger, transition, style, animate, query } from '@angular/animations';

export const routeFadeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0 })
    ], { optional: true }),
    query(':leave', [
      style({ position: 'absolute', width: '100%', top: 0, left: 0 }),
      animate('120ms ease-out', style({ opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      animate('150ms ease-in', style({ opacity: 1 }))
    ], { optional: true })
  ])
]);
