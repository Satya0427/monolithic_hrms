import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService, Theme } from './core/services/theme.service';
import { Header } from './layout/header/header';
import { MATERIAL } from './shared/material/materials';
import { Login } from "./features/auth/login/login";
import { Loader } from './shared/components/loader/loader';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MATERIAL, Loader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  public themeService = inject(ThemeService);

  isDarkTheme = () => this.themeService.currentTheme$() === 'cyan-orange-theme';

  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}

