import { AvailbleBSPositions } from 'ngx-bootstrap/positioning';

export interface IButton {
  type?: string;
  classButton?: string;
  disabledClassButton?: string;
  customHtml?: string;
  disabled?: boolean;
  tooltip?: string;
  placement?: AvailbleBSPositions;
  tooltipClass?: string;
}
