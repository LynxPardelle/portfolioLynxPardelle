import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

/* Modules */
import { BootstrapModule } from './bootstrap.module';

/* NGX-Uploader */
import { NgxUploaderModule } from '@angular-ex/uploader';

/* YoutubePlayer */
import { YouTubePlayerModule } from '@angular/youtube-player';

/* NGX-Translate */
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

/* Directives */
import { NgInitDirective } from './directives/ng-init.directive';

/* Pipes */
import { SafeHtmlPipe } from './pipes/safe-html';

/* Components */
import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';

@NgModule({
  declarations: [
    /* Directives */
    NgInitDirective,

    /* Pipes */
    SafeHtmlPipe,

    /* Components */
    FileUploaderComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BootstrapModule,
    HttpClientModule,

    /* NGX-Uploader */
    NgxUploaderModule,

    /* YoutubePlayer */
    YouTubePlayerModule,

    /* configure the imports */
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [
    /* Modules */
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BootstrapModule,

    /* NGX-Uploader */
    NgxUploaderModule,

    /* YoutubePlayer */
    YouTubePlayerModule,

    /* Translatemodule */
    TranslateModule,

    /* Directives */
    NgInitDirective,

    /* Pipes */
    SafeHtmlPipe,

    /* Components */
    FileUploaderComponent,
  ],
})
export class SharedModule {}

/* required for AOT compilation */
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
