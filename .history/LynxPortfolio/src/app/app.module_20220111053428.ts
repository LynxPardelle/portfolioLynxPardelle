import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// NGX-Translate
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

/* NGX-Bootstrap */
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';

// NGX-Uploader
import { NgxUploaderModule } from 'ngx-uploader';


// YoutubePlayer
import { YouTubePlayerModule } from '@angular/youtube-player';

/* Components */
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { AppComponent } from './app.component';

/* Main */
import { InicioComponent } from './components/main/inicio/inicio.component';
import { ErrorComponent } from './components/main/error/error.component';
import { WebsitesComponent } from './components/websites/websites.component';
import { DemoreelComponent } from './components/demoreel/demoreel.component';
import { BookComponent } from './components/book/book.component';
import { MusicComponent } from './components/music/music.component';
import { CvComponent } from './components/cv/cv.component';
import { LoginComponent } from './components/login/login.component';

/* Blog */
import { BlogComponent } from './components/blog/blog/blog.component';
import { ArticleComponent } from './components/blog/article/article.component';

/* Web Utility */
import { FileUploaderComponent } from './components/web-utility/file-uploader/file-uploader.component';

/* Services */
import { GlobalMain, GlobalWeb } from './services/global';
import { MainService } from './services/main.service';
import { WebService } from './services/web.service';
import { BefService } from './services/bef.service';
import { SharedService } from './services/shared.service';

/* Pipes */
import { SafeHtmlPipe } from './pipes/safe-html';

@NgModule({
  declarations: [
    AppComponent,
    SafeHtmlPipe,

    // Main
    InicioComponent,
    ErrorComponent,
    WebsitesComponent,
    DemoreelComponent,
    BookComponent,
    MusicComponent,
    CvComponent,
    LoginComponent,

    // Blog
    BlogComponent,
    ArticleComponent,

    /* Web Utility */
    FileUploaderComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,

    // configure the imports
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),

    /* NGX-Bootstrap */
    BsDropdownModule.forRoot(),
    AccordionModule.forRoot(),
    ModalModule.forRoot(),

    // NGX-Uploader
    NgxUploaderModule,

    // YoutubePlayer
    YouTubePlayerModule,
  ],
  providers: [MainService, WebService, BefService, SharedService],
  bootstrap: [AppComponent],
})
export class AppModule {}

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
