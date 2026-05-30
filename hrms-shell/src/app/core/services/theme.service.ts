import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

// Define the available theme types (must match the classes in _theme.scss)
export type Theme = 
  | 'rose-red-theme' 
  | 'azure-blue-theme' 
  | 'magenta-violet-theme' 
  | 'cyan-orange-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);

  // Set the default theme
  private currentTheme = signal<Theme>('azure-blue-theme'); 
  public currentTheme$ = this.currentTheme.asReadonly(); 

  // List all possible theme classes for removal
  private allThemes: Theme[] = [
    'rose-red-theme', 
    'azure-blue-theme', 
    'magenta-violet-theme', 
    'cyan-orange-theme'
  ];

  // Effect to manage the <body> class and color-scheme
  private themeEffect = effect(() => {
    const theme = this.currentTheme();
    const body = this.document.body;

    // 1. Remove all existing theme classes
    this.allThemes.forEach(t => body.classList.remove(t));

    // 2. Add the new theme class
    body.classList.add(theme);

    // 3. Set color-scheme (cyan-orange was defined as dark in SCSS)
    const colorScheme = (theme === 'cyan-orange-theme') ? 'dark' : 'light';
    body.style.colorScheme = colorScheme;
    
    // 4. Save the preference
    localStorage.setItem('theme', theme);
  });

  constructor() {
    // Initialize with saved theme or default
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && this.allThemes.includes(savedTheme)) {
      this.currentTheme.set(savedTheme);
    }
  }

  public setTheme(theme: Theme): void {
    if (this.allThemes.includes(theme)) {
        this.currentTheme.set(theme);
    }
  }
}