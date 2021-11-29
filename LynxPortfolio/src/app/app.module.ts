import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/* NGX-Bootstrap */
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

/* Components */
import { AppComponent } from './app.component';

// Main
import { InicioComponent } from './components/main/inicio/inicio.component';
import { ErrorComponent } from './components/main/error/error.component';

@NgModule({
  declarations: [
    AppComponent,

    // Main
    InicioComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    /* NGX-Bootstrap */
    BsDropdownModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
