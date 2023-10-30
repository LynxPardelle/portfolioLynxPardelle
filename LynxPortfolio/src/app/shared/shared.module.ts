import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

/* Modules */
import { BootstrapModule } from './bootstrap.module';

/* NGX-Uploader */
import { NgxUploaderModule } from '@angular-ex/uploader';

/* Moment */
import { MomentModule } from 'ngx-moment';

/* YoutubePlayer */
import { YouTubePlayerModule } from '@angular/youtube-player';

/* NGX-Translate */
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

/* Directives */
import { NgInitDirective } from './directives/ng-init.directive';

/* Pipes */
import { SafeHtmlPipe } from './pipes/safe-html';
import { HarshifyPipe } from './pipes/harshify.pipe';

/* Components */
import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';
import { GenericButtonComponent } from './components/generic-button/generic-button.component';
import { GenericInputComponent } from './components/generic-input/generic-input.component';
import { GenericDropdownComponent } from './components/generic-dropdown/generic-dropdown.component';
import { GenericGroupButtonsComponent } from './components/generic-group-buttons/generic-group-buttons.component';
import { LinkifyPipe } from './pipes/linkify.pipe';

@NgModule({
  declarations: [
    /* Directives */
    NgInitDirective,

    /* Pipes */
    SafeHtmlPipe,
    HarshifyPipe,
    LinkifyPipe,

    /* Components */
    FileUploaderComponent,
    GenericButtonComponent,
    GenericInputComponent,
    GenericGroupButtonsComponent,
    GenericDropdownComponent,
    GenericGroupButtonsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BootstrapModule,
    HttpClientModule,

    /* NGX-Uploader */
    NgxUploaderModule,

    /* Moment */
    MomentModule.forRoot({
      relativeTimeThresholdOptions: {
        m: 59,
      },
    }),

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

    /* Moment */
    MomentModule,

    /* YoutubePlayer */
    YouTubePlayerModule,

    /* Translatemodule */
    TranslateModule,

    /* Directives */
    NgInitDirective,

    /* Pipes */
    SafeHtmlPipe,
    HarshifyPipe,
    LinkifyPipe,

    /* Components */
    FileUploaderComponent,
    GenericButtonComponent,
    GenericInputComponent,
    GenericGroupButtonsComponent,
    GenericDropdownComponent,
    GenericGroupButtonsComponent,
  ],
})
export class SharedModule {}

/* required for AOT compilation */
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
