import { IgxCheckboxComponent } from '../../checkbox/checkbox.component';

export interface RowType {
    nativeElement: HTMLElement;
    checkboxElement: IgxCheckboxComponent;
    rowID: any;
    rowData: any;
    rowSelectable: boolean;
    index: number;
    gridID: string;
    added: boolean;
    deleted: boolean;
    selected: boolean;
    active: boolean;
    expanded?: boolean;
    treeRow?: any;
}
