import { Component, input } from '@angular/core';

export interface Movie {
  id: string;
  name: string;
  thumbnail: string;
  releaseDate: string;
  ticketPrice: number;
}

export interface CartItem {
  movie: Movie;
  quantity: number;
  total: number;
}

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  templateUrl: './shopping-cart.html',
})
export class ShoppingCartComponent {
  cart = input.required<CartItem[]>();
  subtotal = input.required<number>();
  taxAmount = input.required<number>();
  totalCost = input.required<number>();
  removeFromCart = input.required<(movieId: string) => void>();
  updateQuantity = input.required<(movieId: string, delta: number) => void>();

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }).format(amount);
  }
}
