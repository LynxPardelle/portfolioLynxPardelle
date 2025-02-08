import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

/* Services */
import { SharedService } from 'src/app/shared/services/shared.service';
import { NgxBootstrapExpandedFeaturesService as BefService } from 'ngx-bootstrap-expanded-features';

/* Pipes */
import { HarshifyPipe } from 'src/app/shared/pipes/harshify.pipe';

/* NGX-Bootstrap */
import { TooltipConfig } from 'ngx-bootstrap/tooltip';

import { AvailableBSPositions } from 'ngx-bootstrap/positioning';

export function getAlertConfig(
  placement: AvailableBSPositions,
  container: string
): TooltipConfig {
  return Object.assign(new TooltipConfig(), {
    placement: placement,
    container: container,
  });
}
@Component({
    selector: 'generic-button',
    templateUrl: './generic-button.component.html',
    styleUrls: ['./generic-button.component.scss'],
    providers: [
        { provide: TooltipConfig, useFactory: getAlertConfig },
        HarshifyPipe,
    ],
    standalone: false
})
export class GenericButtonComponent implements OnInit {
  public randomId: string = '';

  @Input() type: string = 'customHTML';
  @Input() classButton: string = '';
  @Input() customHtml!: string;
  @Input() disabled: boolean = false;
  @Input() disabledClassButton: string = '';
  @Input() tooltip: string = '';
  @Input() placement: AvailableBSPositions = 'auto';
  @Input() tooltipClass: string = '';

  /* Output */
  @Output() clicked = new EventEmitter<any>();
  @Output() buttonId = new EventEmitter<any>();
  constructor(
    private _harshifyPipe: HarshifyPipe,
    private _befService: BefService,
    private _sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.randomId = this._harshifyPipe.transform(9, 'letters');
    getAlertConfig(this.placement, `${this.randomId}`);
    this.buttonId.emit(this.randomId);
    if (this.classButton) {
      this._befService.updateClasses(
        this.classButton
          .split(' ')
          .filter((c) => c !== '' && c.includes('bef-'))
      );
    }
    this.cssCreate();
  }

  getHtml() {
    return this._sharedService.getHTML(
      this.customHtml ? this.customHtml : this.type
    );
  }

  cssCreate() {
    this._befService.cssCreate();
  }
}
