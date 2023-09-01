import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
/* Modules */
import { SharedModule } from './shared/shared.module';
/* Components */
import { AppComponent } from './app.component';
import { InicioComponent } from './core/components/inicio/inicio.component';
import { ErrorComponent } from './core/components/error/error.component';
import { WebsitesComponent } from './core/components/websites/websites.component';
import { DemoreelComponent } from './core/components/demoreel/demoreel.component';
import { BookComponent } from './core/components/book/book.component';
import { MusicComponent } from './core/components/music/music.component';
import { CvComponent } from './core/components/cv/cv.component';
/* Interceptors */
import { TokenInterceptor } from './core/interceptors/token.interceptor';
/* State */
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { ROOT_REDUCERS } from './state/app.state';
import { MainEffects } from './state/effects/main.effects';
@NgModule({
  declarations: [
    AppComponent,
    InicioComponent,
    ErrorComponent,
    WebsitesComponent,
    DemoreelComponent,
    BookComponent,
    MusicComponent,
    CvComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    /* Shared */
    SharedModule,
    /* State */
    StoreModule.forRoot(ROOT_REDUCERS),
    EffectsModule.forRoot([MainEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: !isDevMode(),
      name: 'LynxPortfolio',
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
