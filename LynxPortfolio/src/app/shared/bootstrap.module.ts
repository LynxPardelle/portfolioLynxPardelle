import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/* NGX-Bootstrap */
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    /* NGX-Bootstrap */
    BsDropdownModule.forRoot(),
    AccordionModule.forRoot(),
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
  ],
  exports: [
    /* NGX-Bootstrap */
    BsDropdownModule,
    AccordionModule,
    ModalModule,
    TooltipModule,
  ],
})
export class BootstrapModule {}
