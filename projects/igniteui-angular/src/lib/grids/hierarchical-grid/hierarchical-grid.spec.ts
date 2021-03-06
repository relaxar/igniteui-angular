import { configureTestSuite } from '../../test-utils/configure-suite';
import { async, TestBed, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxHierarchicalGridModule } from './index';
import { ChangeDetectorRef, Component, ViewChild, AfterViewInit } from '@angular/core';
import { IgxHierarchicalGridComponent } from './hierarchical-grid.component';
import { wait, UIInteractions } from '../../test-utils/ui-interactions.spec';
import { IgxRowIslandComponent, IGridCreatedEventArgs } from './row-island.component';
import { IgxHierarchicalRowComponent } from './hierarchical-row.component';
import { By } from '@angular/platform-browser';
import { IgxChildGridRowComponent } from './child-grid-row.component';
import { DisplayDensity } from '../../core/displayDensity';
import { IgxStringFilteringOperand } from '../../data-operations/filtering-condition';
import { IGridCellEventArgs } from '../grid';
import { GridSelectionMode } from '../common/enums';

describe('Basic IgxHierarchicalGrid #hGrid', () => {
    configureTestSuite();
    let fixture;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridTestBaseComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridTestBaseComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should render expansion indicator as the first element of each expandable row.', () => {
        fixture.componentInstance.data = [
            {ID: 0, ProductName: 'Product: A0'},
            {ID: 1, ProductName: 'Product: A1', childData: fixture.componentInstance.generateDataUneven(1, 1)},
            {ID: 2, ProductName: 'Product: A2', childData: fixture.componentInstance.generateDataUneven(1, 1)}
        ];
        fixture.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.hasChildren).toBe(true);
        const rowElems = fixture.debugElement.queryAll(By.directive(IgxHierarchicalRowComponent));
        expect(rowElems[0].query(By.css('igx-icon')).nativeElement.innerText).toEqual('chevron_right');
        const row2 = hierarchicalGrid.getRowByIndex(1) as IgxHierarchicalRowComponent;
        expect(row2.hasChildren).toBe(true);
        expect(rowElems[1].query(By.css('igx-icon')).nativeElement.innerText).toEqual('chevron_right');

        const row3 = hierarchicalGrid.getRowByIndex(1) as IgxHierarchicalRowComponent;
        expect(row3.hasChildren).toBe(true);
        expect(rowElems[2].query(By.css('igx-icon')).nativeElement.innerText).toEqual('chevron_right');
    });

    it('should allow expand/collapse rows through the UI', fakeAsync(/** row toggle rAF */() => {
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.expanded).toBe(false);
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();
        expect(row1.expanded).toBe(true);
        expect(hierarchicalGrid.hgridAPI.getChildGrids(false).length).toBe(1);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();
        expect(row1.expanded).toBe(false);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxHierarchicalRowComponent).toBe(true);
    }));

    it('should change expand/collapse indicators when state of the row changes', fakeAsync(/** row toggle rAF */() => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        const rowElem = fixture.debugElement.queryAll(By.directive(IgxHierarchicalRowComponent))[0];
        expect(rowElem.query(By.css('igx-icon')).nativeElement.innerText).toEqual('chevron_right');
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        expect(rowElem.query(By.css('igx-icon')).nativeElement.innerText).toEqual('expand_more');
    }));

    it('should collapse all rows that belongs to a grid via header collapse icon', fakeAsync(/** row toggle rAF */() => {
        const headerExpanderElem = fixture.debugElement.queryAll(By.css('.igx-grid__hierarchical-expander--header'))[0];
        let icon = headerExpanderElem.query(By.css('igx-icon')).componentInstance;
        let iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(false);
        // expand row
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        icon = headerExpanderElem.query(By.css('igx-icon')).componentInstance;
        iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(true);
        expect(hierarchicalGrid.expansionStates.size).toEqual(1);

        UIInteractions.clickElement(icon.el);
        fixture.detectChanges();
        const rows = hierarchicalGrid.dataRowList.toArray() as IgxHierarchicalRowComponent[];
        rows.forEach((r) => {
            expect(r.expanded).toBe(false);
        });
        icon = headerExpanderElem.query(By.css('igx-icon')).componentInstance;
        iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(false);
        expect(hierarchicalGrid.expansionStates.size).toEqual(0);
    }));

    it('should allow applying initial expansions state for certain rows through expansionStates option', () => {
        // set first row as expanded.
        const state = new Map<any, boolean>();
        state.set(fixture.componentInstance.data[0], true);
        hierarchicalGrid.expansionStates = state;
        hierarchicalGrid.cdr.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        expect(hierarchicalGrid.hgridAPI.getChildGrids(false).length).toBe(1);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
    });

    it('should allow defining more than one nested row islands', fakeAsync(/** row toggle rAF */() => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const childGrid = hierarchicalGrid.hgridAPI.getChildGrids(false)[0];
        const childRow = childGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(childRow.expander);
        fixture.detectChanges();

        // should have 3 level hierarchy
        const allChildren =  hierarchicalGrid.hgridAPI.getChildGrids(true);
        expect(allChildren.length).toBe(2);
        expect(hierarchicalGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
        expect(childGrid.getRowByIndex(1) instanceof IgxChildGridRowComponent).toBe(true);
    }));

    it('should retain expansion states when scrolling', (async () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        expect(row.expanded).toBe(true);
        // scroll to bottom
        hierarchicalGrid.verticalScrollContainer.scrollTo(hierarchicalGrid.dataView.length - 1);
        await wait(100);
        fixture.detectChanges();
        // scroll to top
        hierarchicalGrid.verticalScrollContainer.scrollTo(0);
        await wait(100);
        fixture.detectChanges();
        expect((hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent).expanded).toBe(true);
    }));

    it('should show header collapse button if grid has data and row island is defined.', () => {
        fixture.componentInstance.data = [
            {ID: 0, ProductName: 'Product: A0'}
        ];
        fixture.detectChanges();
        const headerExpanderElem = fixture.debugElement.queryAll(By.css('.igx-grid__hierarchical-expander--header'))[0];
        const icon = headerExpanderElem.query(By.css('igx-icon'));
        expect(icon).toBeDefined();
    });

    it('should render last cell of rows fully visible when columns does not have width specified and without scrollbar', () => {
        const firstRowCell: HTMLElement = hierarchicalGrid.getRowByIndex(0).cells.last.nativeElement;
        const cellLeftOffset = firstRowCell.offsetLeft + firstRowCell.parentElement.offsetLeft + firstRowCell.offsetWidth;
        const gridWidth = hierarchicalGrid.nativeElement.offsetWidth;
        expect(cellLeftOffset).not.toBeGreaterThan(gridWidth);

        const hScroll = hierarchicalGrid.headerContainer.getScroll();
        expect(hScroll.children[0].offsetWidth).not.toBeGreaterThan(hScroll.offsetWidth);
    });

    it('should allow extracting child grids using hgridAPI', () => {
        // set first row as expanded.
        const state = new Map<any, boolean>();
        state.set(fixture.componentInstance.data[0], true);
        hierarchicalGrid.expansionStates = state;
        hierarchicalGrid.cdr.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        const childGrid = hierarchicalGrid.hgridAPI.getChildGrid([{ rowID: fixture.componentInstance.data[0], rowIslandKey: 'childData' }]);
        expect(childGrid).not.toBeNull();
        const childState = new Map<any, boolean>();
        childState.set(fixture.componentInstance.data[0].childData[0], true);
        childGrid.expansionStates = childState;
        childGrid.cdr.detectChanges();
        const grandChildGrid = hierarchicalGrid.hgridAPI.getChildGrid([
            { rowID: fixture.componentInstance.data[0], rowIslandKey: 'childData' },
            { rowID: fixture.componentInstance.data[0].childData[0], rowIslandKey: 'childData' }
        ]);
        expect(grandChildGrid).not.toBeNull();

        const rowIsland1 = hierarchicalGrid.hgridAPI.getChildRowIsland('childData');
        const rowIsland2 = hierarchicalGrid.allLayoutList.find(layout => layout.id === 'igx-row-island-childData-childData');
        expect(rowIsland1.key).toBe('childData');
        expect(rowIsland2.key).toBe('childData');
    });

    it('should allow setting expandChildren after bound to data', () => {
        // set first row as expanded.
        const state = new Map<any, boolean>();
        state.set(fixture.componentInstance.data[0], true);
        hierarchicalGrid.expansionStates = state;
        hierarchicalGrid.cdr.detectChanges();
        let row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        hierarchicalGrid.expandChildren = false;
        hierarchicalGrid.cdr.detectChanges();
        row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.expanded).toBe(false);
        const expandIcons = fixture.debugElement.queryAll(By.css('#igx-icon-15'));
        expect(expandIcons.length).toBe(0);
        let rows = hierarchicalGrid.dataRowList.toArray() as IgxHierarchicalRowComponent[];
        rows.forEach((r) => {
            expect(r.expanded).toBe(false);
        });
        hierarchicalGrid.expandChildren = true;
        hierarchicalGrid.cdr.detectChanges();
        rows = hierarchicalGrid.dataRowList.toArray() as IgxHierarchicalRowComponent[];
        rows.forEach((r) => {
            expect(r.expanded).toBe(true);
        });

        row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(row1.expanded).toBe(true);
    });

    it('should allow setting expandChildren after bound to data to rowIsland', () => {
        // set first row as expanded.
        const state = new Map<any, boolean>();
        state.set(fixture.componentInstance.data[0], true);
        hierarchicalGrid.expansionStates = state;
        hierarchicalGrid.cdr.detectChanges();
        const row1 = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        // verify row is expanded
        expect(row1.expanded).toBe(true);
        // expand children for the rowIsland should be false by default
        expect(fixture.componentInstance.rowIsland.expandChildren).toBeFalsy();
        fixture.componentInstance.rowIsland.expandChildren = true;
        fixture.detectChanges();
        const childGrid = hierarchicalGrid.hgridAPI.getChildGrid([{ rowID: fixture.componentInstance.data[0], rowIslandKey: 'childData' }]);
        const childRow = childGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(childRow.expanded).toBe(true);
        let rows = childGrid.dataRowList.toArray();
        rows.forEach((r) => {
            expect(r.expanded).toBe(true);
        });
        fixture.componentInstance.rowIsland.expandChildren = false;
        fixture.detectChanges();
        rows = childGrid.dataRowList.toArray();
        rows.forEach((r) => {
            expect(r.expanded).toBe(false);
        });

    });

    it('should render correctly when display density is changed', fakeAsync(() => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        expect(hierarchicalGrid.displayDensity).toEqual(DisplayDensity.comfortable);

        hierarchicalGrid.displayDensity = DisplayDensity.cosy;
        fixture.detectChanges();
        tick(100);

        expect(hierarchicalGrid.nativeElement.classList.contains('igx-grid--cosy')).toBe(true);
        expect(childGrid.displayDensity).toBe(DisplayDensity.cosy);

        hierarchicalGrid.displayDensity = DisplayDensity.compact;
        fixture.detectChanges();
        tick(100);

        expect(hierarchicalGrid.nativeElement.classList.contains('igx-grid--compact')).toBe(true);
        expect(childGrid.displayDensity).toBe(DisplayDensity.compact);
    }));

    it('should update child grid data when root grid data is changed.', () => {
        const newData1 = [
            {
                ID: 0, ChildLevels: 0,  ProductName: 'Product: A', childData: [ {   ID: 1, ProductName: 'Product: Child A' } ]
            },
            {
                ID: 1, ChildLevels: 0,  ProductName: 'Product: A1', childData: [ {   ID: 2, ProductName: 'Product: Child A' } ]
            },
            {
                ID: 2, ChildLevels: 0,  ProductName: 'Product: A2', childData: [ {   ID: 3, ProductName: 'Product: Child A' } ]
            }
        ];
        fixture.componentInstance.data = newData1;
        fixture.detectChanges();
        let row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        let childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        let childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        expect(childGrid.data).toBe(newData1[0].childData);

        const newData2 = [
            {
                ID: 0, ChildLevels: 0,  ProductName: 'Product: A', childData: [ {   ID: 10, ProductName: 'Product: New Child A' } ]
            },
            {
                ID: 1, ChildLevels: 0,  ProductName: 'Product: A1', childData: [ {   ID: 20, ProductName: 'Product: New Child A' } ]
            },
            {
                ID: 2, ChildLevels: 0,  ProductName: 'Product: A2', childData: [ {   ID: 30, ProductName: 'Product: New Child A' } ]
            }
        ];
        fixture.componentInstance.data = newData2;
        fixture.detectChanges();

        row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        expect(childGrid.data).toBe(newData2[0].childData);

    });

    it('when child width is in percents its width should be update if parent width changes while parent row is collapsed. ', async () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;
        expect(childGrid.calcWidth - 370).toBeLessThan(3);
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        fixture.componentInstance.width = '300px';
        fixture.detectChanges();
        await wait(30);
        fixture.detectChanges();
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        expect(childGrid.calcWidth - 170).toBeLessThan(3);
    });

    it('should exit edit mode on row expand/collapse through the UI', async() => {
        hierarchicalGrid.primaryKey = 'ID';
        hierarchicalGrid.rowEditable = true;
        fixture.detectChanges();
        wait();

        const masterGridFirstRow = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        expect(masterGridFirstRow.expanded).toBeFalsy();

        const masterGridSecondCell = masterGridFirstRow.cells.find(c => c.columnIndex === 1);
        expect(masterGridSecondCell.editMode).toBeFalsy();

        masterGridSecondCell.setEditMode(true);
        fixture.detectChanges();
        wait();

        expect(masterGridSecondCell.editMode).toBeTruthy();

        UIInteractions.clickElement(masterGridFirstRow.expander);
        fixture.detectChanges();
        wait();

        expect(masterGridFirstRow.expanded).toBeTruthy();
        expect(masterGridSecondCell.editMode).toBeFalsy();

        const childGrid = hierarchicalGrid.hgridAPI.getChildGrids(false)[0] as IgxHierarchicalGridComponent;
        expect(childGrid).toBeDefined();

        childGrid.columnList.find(c => c.index === 1).editable = true;
        const childGridSecondRow = childGrid.getRowByIndex(1) as IgxHierarchicalRowComponent;
        expect(childGridSecondRow.expanded).toBeFalsy();

        const childGridSecondCell = childGridSecondRow.cells.find(c => c.columnIndex === 1);
        expect(childGridSecondCell.editMode).toBeFalsy();

        childGridSecondCell.setEditMode(true);
        fixture.detectChanges();
        wait();

        expect(childGridSecondCell.editMode).toBeTruthy();

        UIInteractions.clickElement(masterGridFirstRow.expander);
        fixture.detectChanges();
        wait();

        expect(childGrid.crudService.inEditMode).toBeFalsy();
        expect(childGridSecondRow.inEditMode).toBeFalsy();
    });

    it('child grid width should be recalculated if parent no longer shows scrollbar.', async () => {
        hierarchicalGrid.height = '1000px';
        fixture.detectChanges();
        hierarchicalGrid.filter('ProductName', 'A0', IgxStringFilteringOperand.instance().condition('contains'), true);
        fixture.detectChanges();
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;
        expect(childGrid.calcWidth - 370 - childGrid.scrollWidth).toBeLessThanOrEqual(5);

        hierarchicalGrid.clearFilter();
        fixture.detectChanges();
        await wait(100);
        fixture.detectChanges();

        expect(childGrid.calcWidth - 370 ).toBeLessThan(3);
    });
});

describe('IgxHierarchicalGrid Row Islands #hGrid', () => {
    configureTestSuite();
    let fixture;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridMultiLayoutComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridMultiLayoutComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should allow defining row islands on the same level', fakeAsync(/** height/width setter rAF */() => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        const childRows = fixture.debugElement.queryAll(By.directive(IgxChildGridRowComponent));
        expect(childGrids.length).toBe(2);
        expect(childRows.length).toBe(2);
        const ri1 = fixture.componentInstance.rowIsland1;
        const ri2 = fixture.componentInstance.rowIsland2;
        expect(childRows[0].componentInstance.layout).toBe(ri1);
        expect(childRows[1].componentInstance.layout).toBe(ri2);
    }));

    it('should display correct data for sibling row islands', fakeAsync(/** height/width setter rAF + row toggle */() => {
        const uniqueData = [
            {
                ID: 1,
                ProductName : 'Parent Name',
                childData: [
                    {
                        ID: 11,
                        ProductName : 'Child1 Name'
                    }
                ],
                childData2: [
                    {
                        ID: 12,
                        Col1: 'Child2 Col1',
                        Col2: 'Child2 Col2',
                        Col3: 'Child2 Col3'
                    }
                ]
            }
        ];

        fixture.componentInstance.data = uniqueData;
        fixture.detectChanges();

        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);

        // check if data for each is correct
        const child1 = childGrids[0];
        const child2 = childGrids[1];

        expect(child1.data).toBe(fixture.componentInstance.data[0].childData);
        expect(child2.data).toBe(fixture.componentInstance.data[0].childData2);

        expect(child1.getCellByColumn(0, 'ID').value).toBe(11);
        expect(child1.getCellByColumn(0, 'ProductName').value).toBe('Child1 Name');

        expect(child2.getCellByColumn(0, 'Col1').value).toBe('Child2 Col1');
        expect(child2.getCellByColumn(0, 'Col2').value).toBe('Child2 Col2');
        expect(child2.getCellByColumn(0, 'Col3').value).toBe('Child2 Col3');

    }));

    it('should apply the set options on the row island to all of its related child grids.',
    fakeAsync(/** height/width setter rAF + row toggle rAF */() => {
        fixture.componentInstance.height = '200px';
        fixture.detectChanges();
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        expect(childGrids[0].height).toBe('200px');
        expect(childGrids[1].height).toBe('200px');
    }));

    it('Should apply runtime option changes to all related child grids (both existing and not yet initialized).',
    async() => { /** height/width setter rAF + row toggle rAF */
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const ri1 = fixture.componentInstance.rowIsland1;
        ri1.rowSelection = GridSelectionMode.multiple;
        fixture.detectChanges();
        await wait();

        // check rendered grid
        let childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        expect(childGrids[0].rowSelection).toBe( GridSelectionMode.multiple);
        expect(childGrids[1].rowSelection).toBe(GridSelectionMode.none);

        // expand new row and check newly generated grid
        const row2 = hierarchicalGrid.getRowByIndex(3) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row2.expander);
        fixture.detectChanges();
        await wait();
        childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);
        expect(childGrids[0].rowSelection).toBe( GridSelectionMode.multiple);
        expect(childGrids[1].rowSelection).toBe( GridSelectionMode.multiple);
        expect(childGrids[2].rowSelection).toBe(GridSelectionMode.none);
        expect(childGrids[3].rowSelection).toBe(GridSelectionMode.none);
    });
    it('should apply column settings applied to the row island to all related child grids.',
    async() => { /** height/width setter rAF + row toggle rAF */
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        await wait();

        const ri1 = fixture.componentInstance.rowIsland1;
        const ri2 = fixture.componentInstance.rowIsland2;

        const childGrids = hierarchicalGrid.hgridAPI.getChildGrids(false);

        const child1Cols = childGrids[0].columnList.toArray();
        const riCols = ri1.columnList.toArray();
        expect(child1Cols.length).toEqual(riCols.length);
        for (let i = 0; i < riCols.length; i++) {
            const col = child1Cols.find((c) => c.key === riCols[i].key);
            expect(col).not.toBeNull();
        }
        const child2Cols = childGrids[1].columnList.toArray();
        const ri2Cols = ri2.columnList.toArray();
        expect(child2Cols.length).toEqual(ri2Cols.length);
        for (let j = 0; j < riCols.length; j++) {
            const col = child2Cols.find((c) => c.key === ri2Cols[j].key);
            expect(col).not.toBeNull();
        }
    });
    it('should allow setting different height/width in px/percent for row islands and grids should be rendered correctly.',
    (/** height/width setter + row toggle rAF */async() => {
        const ri1 = fixture.componentInstance.rowIsland1;

        // test px
        ri1.height = '200px';
        ri1.width = '200px';

        fixture.detectChanges();

        let row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        await wait(100);
        fixture.detectChanges();
        let childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        let childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        // check sizes are applied
        expect(childGrid.width).toBe(ri1.width);
        expect(childGrid.height).toBe(ri1.height);
        expect(childGrid.nativeElement.style.height).toBe(ri1.height);
        expect(childGrid.nativeElement.style.width).toBe(ri1.width);
        // check virtualization state
        expect(childGrid.verticalScrollContainer.state.chunkSize).toBe(4);
        expect(childGrid.verticalScrollContainer.getScroll().scrollHeight).toBe(357);

        let hVirt = childGrid.getRowByIndex(0).virtDirRow;
        expect(hVirt.state.chunkSize).toBe(2);
        expect(hVirt.getScroll().scrollWidth).toBe(272);
        // collapse row
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        // test %
        ri1.height = '50%';
        ri1.width = '50%';

        fixture.detectChanges();
        row = hierarchicalGrid.getRowByIndex(1) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();


        childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

         // check sizes are applied
         expect(childGrid.width).toBe(ri1.width);
         expect(childGrid.height).toBe(ri1.height);
         expect(childGrid.nativeElement.style.height).toBe(ri1.height);
         expect(childGrid.nativeElement.style.width).toBe(ri1.width);
         // check virtualization state
         expect(childGrid.verticalScrollContainer.state.chunkSize).toBe(11);
         expect(childGrid.verticalScrollContainer.getScroll().scrollHeight).toBe(714);
         hVirt = childGrid.getRowByIndex(0).virtDirRow;
         expect(hVirt.getScroll().scrollWidth).toBe(272);
    }));

    it('should destroy cached instances of child grids when root grid is destroyed', (async () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const children = hierarchicalGrid.hgridAPI.getChildGrids(true);
        expect(children.length).toBe(2);
        const child1 = children[0];
        const child2 = children[1];
        expect(child1._destroyed).toBeFalsy();
        expect(child2._destroyed).toBeFalsy();
        hierarchicalGrid.verticalScrollContainer.scrollTo(hierarchicalGrid.dataView.length - 1);
        await wait(100);
        fixture.detectChanges();

        // check that we have child is not destroyed
        expect(child1._destroyed).toBeFalsy();
        expect(child2._destroyed).toBeFalsy();

        // destroy hgrid
        fixture.destroy();

        expect(child1._destroyed).toBeTruthy();
        expect(child2._destroyed).toBeTruthy();
    }));

    it('should emit child grid events with the related child grid instance as an event arg.', async() => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        await wait(100);
        fixture.detectChanges();

        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;
        const cell = childGrid.getRowByIndex(0).cells.toArray()[0];
        const ri1 = fixture.componentInstance.rowIsland1;

        spyOn(ri1.onCellClick, 'emit').and.callThrough();

        const event = new Event('click');
        cell.nativeElement.dispatchEvent(event);
        const args: IGridCellEventArgs = {
            cell: cell,
            event: event,
            owner: childGrid
        };

        fixture.detectChanges();
        expect(ri1.onCellClick.emit).toHaveBeenCalledTimes(1);
        expect(ri1.onCellClick.emit).toHaveBeenCalledWith(args);
    });
});

describe('IgxHierarchicalGrid Children Sizing #hGrid', () => {
    configureTestSuite();
    let fixture;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    const TBODY_CLASS = '.igx-grid__tbody-content';
    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridSizingComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridSizingComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should create a child grid with null height when its data is unset then set to a number under 10', fakeAsync(() => {
        fixture.detectChanges();
        // expansion
        const row = hierarchicalGrid.rowList.first as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        let defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBeFalsy();
        expect(childGrid.calcHeight).toBeNull();
        childGrid.data = fixture.componentInstance.data;
        fixture.detectChanges();

        defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBeFalsy();
        expect(childGrid.calcHeight).toBeNull();
        expect(childGrid.data.length).toEqual(1);
        expect(childGrid.rowList.length).toEqual(1);
    }));

    it('should create a child grid with auto-size when its data is unset then set to a number above 10', fakeAsync(() => {
        fixture.detectChanges();
        // expansion
        const row = hierarchicalGrid.rowList.first as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        let defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBeFalsy();
        expect(childGrid.calcHeight).toBeNull();
        childGrid.data = fixture.componentInstance.fullData;
        tick();
        fixture.detectChanges();
        defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBe('510px');
        expect(childGrid.calcHeight).toBe(510);
        expect(childGrid.data.length).toEqual(100000);
        expect(childGrid.rowList.length).toEqual(11);
    }));

    it('should create a child grid with auto-size when its data is unset then set to a number above 10 and height is 50%', fakeAsync(() => {
        fixture.componentInstance.childHeight = '50%';
        fixture.detectChanges();
        // expansion
        const row = hierarchicalGrid.rowList.first as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        let defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBeFalsy();
        expect(childGrid.calcHeight).toBeNull();
        childGrid.data = fixture.componentInstance.fullData;
        tick();
        fixture.detectChanges();
        defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBe('510px');
        expect(childGrid.calcHeight).toBe(510);
        expect(childGrid.data.length).toEqual(100000);
        expect(childGrid.rowList.length).toEqual(11);
    }));

    it('should create a child grid fixed size when height is set to px', fakeAsync(() => {
        fixture.componentInstance.childHeight = '600px';
        fixture.detectChanges();
        // expansion
        const row = hierarchicalGrid.rowList.first as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        let defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        let defaultHeightNum = parseInt(defaultHeight, 10);
        expect(defaultHeightNum).toBeGreaterThan(500);
        expect(defaultHeightNum).toBeLessThan(600);
        expect(childGrid.calcHeight).toBeGreaterThan(500);
        expect(childGrid.calcHeight).toBeLessThan(600);
        expect(childGrid.rowList.length).toEqual(0);
        childGrid.data = fixture.componentInstance.fullData;
        tick();
        fixture.detectChanges();
        defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        defaultHeightNum = parseInt(defaultHeight, 10);
        expect(defaultHeightNum).toBeGreaterThan(500);
        expect(defaultHeightNum).toBeLessThan(600);
        expect(childGrid.calcHeight).toBeGreaterThan(500);
        expect(childGrid.calcHeight).toBeLessThan(600);
        expect(childGrid.data.length).toEqual(100000);
        expect(childGrid.rowList.length).toEqual(12);
    }));

    it('should create a child grid null height regardless of data when height is set to null', fakeAsync(() => {
        fixture.componentInstance.childHeight = null;
        fixture.detectChanges();
        // expansion
        const row = hierarchicalGrid.rowList.first as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        const childGrids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const childGrid = childGrids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        let defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBeFalsy();
        expect(childGrid.calcHeight).toBeNull();
        childGrid.data = fixture.componentInstance.semiData;
        tick();
        fixture.detectChanges();
        defaultHeight = childGrids[0].query(By.css(TBODY_CLASS)).styles.height;
        expect(defaultHeight).toBeFalsy();
        expect(childGrid.calcHeight).toBeNull();
        expect(childGrid.data.length).toEqual(15);
        expect(childGrid.rowList.length).toEqual(15);
    }));
});

describe('IgxHierarchicalGrid Remote Scenarios #hGrid', () => {
    configureTestSuite();
    let fixture: ComponentFixture<IgxHGridRemoteOnDemandComponent>;
    const TBODY_CLASS = '.igx-grid__tbody-content';
    const THEAD_CLASS = '.igx-grid__thead';
    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHGridRemoteOnDemandComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHGridRemoteOnDemandComponent);
        fixture.detectChanges();
    }));

    // To investigate why it times out
    it('should render loading indicator when loading and autoGenerate are enabled', fakeAsync(() => {
        fixture.detectChanges();

        const grid = fixture.componentInstance.instance;
        const gridBody = fixture.debugElement.query(By.css(TBODY_CLASS));
        const gridHead = fixture.debugElement.query(By.css(THEAD_CLASS));
        let loadingIndicator = gridBody.query(By.css('.igx-grid__loading'));
        let colHeaders = gridHead.queryAll(By.css('igx-grid-header'));

        expect(loadingIndicator).not.toBeNull();
        expect(colHeaders.length).toBe(0);
        expect(gridBody.nativeElement.textContent).not.toEqual(grid.emptyFilteredGridMessage);

        // Check for loaded rows in grid's container
        grid.shouldGenerate = true;
        fixture.componentInstance.bind();
        fixture.detectChanges();
        tick(1000);

        loadingIndicator = gridBody.query(By.css('.igx-grid__loading'));
        colHeaders = gridHead.queryAll(By.css('igx-grid-header'));
        expect(colHeaders.length).toBeGreaterThan(0);
        expect(loadingIndicator).toBeNull();

        const row = grid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        tick(1000);

        const rowIslandDOM = fixture.debugElement.query(By.css('.igx-grid__hierarchical-indent .igx-grid'));
        const rowIslandBody = rowIslandDOM.query(By.css('.igx-grid__tbody-content'));
        expect(parseInt(window.getComputedStyle(rowIslandBody.nativeElement).height, 10)).toBe(255);
    }));

    it('should render disabled collapse all icon for child grid even when it has no data but with child row island',
    fakeAsync(/** row toggle rAF */() => {
        const hierarchicalGrid = fixture.componentInstance.instance;

        fixture.componentInstance.bind();
        fixture.detectChanges();

        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();
        tick(1000);

        const gridHead = fixture.debugElement.queryAll(By.css(THEAD_CLASS))[1];
        const headerExpanderElem = gridHead.queryAll(By.css('.igx-grid__hierarchical-expander--header'))[0];
        const icon = headerExpanderElem.query(By.css('igx-icon')).componentInstance;
        const iconTxt = headerExpanderElem.query(By.css('igx-icon')).nativeElement.textContent.toLowerCase();
        expect(iconTxt).toBe('unfold_less');
        expect(icon.getActive).toBe(false);
    }));
});

describe('IgxHierarchicalGrid Template Changing Scenarios #hGrid', () => {
    configureTestSuite();
    const TBODY_CLASS = '.igx-grid__tbody-content';
    const THEAD_CLASS = '.igx-grid__thead';
    let fixture: ComponentFixture<IgxHierarchicalGridColumnsUpdateComponent>;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridColumnsUpdateComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridColumnsUpdateComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should render correct columns when setting columns for child in AfterViewInit using ngFor', () => {
        const gridHead = fixture.debugElement.query(By.css(THEAD_CLASS));
        const colHeaders = gridHead.queryAll(By.css('igx-grid-header'));
        expect(colHeaders.length).toEqual(2);
        expect(colHeaders[0].nativeElement.innerText).toEqual('ID');
        expect(colHeaders[1].nativeElement.innerText).toEqual('ProductName');

        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const child1Grids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const child1Grid = child1Grids[0].query(By.css('igx-hierarchical-grid'));
        const child1Headers = child1Grid.queryAll(By.css('igx-grid-header'));

        expect(child1Headers.length).toEqual(5);
        expect(child1Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child1Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child1Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child1Headers[3].nativeElement.innerText).toEqual('Col2');
        expect(child1Headers[4].nativeElement.innerText).toEqual('Col3');

        const row1 = child1Grid.componentInstance.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        const child2Grids =  child1Grid.queryAll(By.css('igx-child-grid-row'));
        const child2Grid = child2Grids[0].query(By.css('igx-hierarchical-grid'));
        const child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));

        expect(child2Headers.length).toEqual(3);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');
    });

    it('should render correct columns when setting columns for parent and child post init using ngFor', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const child1Grids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const child1Grid = child1Grids[0].query(By.css('igx-hierarchical-grid')).componentInstance;

        fixture.componentInstance.parentCols = ['Col1', 'Col2'];
        fixture.componentInstance.islandCols1 = ['ID', 'ProductName', 'Col1'];
        fixture.detectChanges();
        // check parent cols
        expect(hierarchicalGrid.columns.length).toBe(4);
        expect(hierarchicalGrid.columns[0].field).toBe('ID');
        expect(hierarchicalGrid.columns[1].field).toBe('ProductName');
        expect(hierarchicalGrid.columns[2].field).toBe('Col1');
        expect(hierarchicalGrid.columns[3].field).toBe('Col2');
        // check child cols
        expect(child1Grid.columns.length).toBe(3);
        expect(hierarchicalGrid.columns[0].field).toBe('ID');
        expect(hierarchicalGrid.columns[1].field).toBe('ProductName');
        expect(hierarchicalGrid.columns[2].field).toBe('Col1');
    });

    it('should update columns for expanded child when adding column to row island', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const child1Grids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const child1Grid = child1Grids[0].query(By.css('igx-hierarchical-grid'));

        const row1 = child1Grid.componentInstance.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        const child2Grids =  child1Grid.queryAll(By.css('igx-child-grid-row'));
        const child2Grid = child2Grids[0].query(By.css('igx-hierarchical-grid'));
        let child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));

        expect(child2Headers.length).toEqual(3);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');

        fixture.componentInstance.islandCols2.push('Col2');
        fixture.detectChanges();

        child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));
        expect(child2Headers.length).toEqual(4);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child2Headers[3].nativeElement.innerText).toEqual('Col2');

        const child1Headers = child1Grid.query(By.css(THEAD_CLASS)).queryAll(By.css('igx-grid-header'));
        expect(child1Headers.length).toEqual(5);
        expect(child1Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child1Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child1Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child1Headers[3].nativeElement.innerText).toEqual('Col2');
        expect(child1Headers[4].nativeElement.innerText).toEqual('Col3');

        const gridHead = fixture.debugElement.query(By.css(THEAD_CLASS));
        const colHeaders = gridHead.queryAll(By.css('igx-grid-header'));
        expect(colHeaders.length).toEqual(2);
        expect(colHeaders[0].nativeElement.innerText).toEqual('ID');
        expect(colHeaders[1].nativeElement.innerText).toEqual('ProductName');
    });

    it('should update columns for rendered child that is collapsed when adding column to row island', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        const child1Grids =  fixture.debugElement.queryAll(By.css('igx-child-grid-row'));
        const child1Grid = child1Grids[0].query(By.css('igx-hierarchical-grid'));

        const row1 = child1Grid.componentInstance.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        const child2Grids =  child1Grid.queryAll(By.css('igx-child-grid-row'));
        const child2Grid = child2Grids[0].query(By.css('igx-hierarchical-grid'));
        let child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));

        expect(child2Headers.length).toEqual(3);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');

        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        fixture.componentInstance.islandCols2.push('Col2');
        fixture.detectChanges();

        UIInteractions.clickElement(row1.expander);
        fixture.detectChanges();

        child2Headers = child2Grid.queryAll(By.css('igx-grid-header'));
        expect(child2Headers.length).toEqual(4);
        expect(child2Headers[0].nativeElement.innerText).toEqual('ID');
        expect(child2Headers[1].nativeElement.innerText).toEqual('ProductName');
        expect(child2Headers[2].nativeElement.innerText).toEqual('Col1');
        expect(child2Headers[3].nativeElement.innerText).toEqual('Col2');
    });
});

describe('IgxHierarchicalGrid Runtime Row Island change Scenarios #hGrid', () => {
    configureTestSuite();
    let fixture: ComponentFixture<IgxHierarchicalGridToggleRIComponent>;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridToggleRIComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridToggleRIComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it('should allow changing row islands runtime in root grid.', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        let hGrids = fixture.debugElement.queryAll(By.css('igx-hierarchical-grid'));

        let childGrids = hierarchicalGrid.hgridAPI.getChildGrids();
        expect(childGrids.length).toBe(1);
        expect(hGrids.length).toBe(2);

        fixture.componentInstance.toggleRI = false;
        fixture.detectChanges();

        hGrids = fixture.debugElement.queryAll(By.css('igx-hierarchical-grid'));
        childGrids = hierarchicalGrid.hgridAPI.getChildGrids();
        expect(childGrids.length).toBe(0);
        expect(hGrids.length).toBe(1);
        expect(row.expander).toBe(undefined);

        fixture.componentInstance.toggleRI = true;
        fixture.detectChanges();

        hGrids = fixture.debugElement.queryAll(By.css('igx-hierarchical-grid'));
        childGrids = hierarchicalGrid.hgridAPI.getChildGrids();
        expect(childGrids.length).toBe(1);
        expect(hGrids.length).toBe(2);
        expect(row.expander).not.toBe(undefined);
    });

    it('should allow changing row islands runtime in child grid.', () => {
        const row = hierarchicalGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(row.expander);
        fixture.detectChanges();

        let childGrid = hierarchicalGrid.hgridAPI.getChildGrids()[0];
        const childRow = childGrid.getRowByIndex(0) as IgxHierarchicalRowComponent;
        UIInteractions.clickElement(childRow.expander);
        fixture.detectChanges();

        let hGrids = fixture.debugElement.queryAll(By.css('igx-hierarchical-grid'));
        expect(hGrids.length).toBe(3);
        expect(childGrid.hgridAPI.getChildGrids().length).toBe(1);

        fixture.componentInstance.toggleChildRI = false;
        fixture.detectChanges();

        hGrids = fixture.debugElement.queryAll(By.css('igx-hierarchical-grid'));
        childGrid = hierarchicalGrid.hgridAPI.getChildGrids()[0];
        expect(hGrids.length).toBe(2);
        expect(childGrid.hgridAPI.getChildGrids().length).toBe(0);

        fixture.componentInstance.toggleChildRI = true;
        fixture.detectChanges();

        hGrids = fixture.debugElement.queryAll(By.css('igx-hierarchical-grid'));
        childGrid = hierarchicalGrid.hgridAPI.getChildGrids()[0];
        expect(hGrids.length).toBe(3);
        expect(childGrid.hgridAPI.getChildGrids().length).toBe(1);

    });

});

describe('IgxHierarchicalGrid custom template #hGrid', () => {
    configureTestSuite();
    let fixture: ComponentFixture<IgxHierarchicalGridCustomTemplateComponent>;
    let hierarchicalGrid: IgxHierarchicalGridComponent;
    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxHierarchicalGridCustomTemplateComponent
            ],
            imports: [
                NoopAnimationsModule, IgxHierarchicalGridModule]
        }).compileComponents();
    }));

    beforeEach(async(() => {
        fixture = TestBed.createComponent(IgxHierarchicalGridCustomTemplateComponent);
        fixture.detectChanges();
        hierarchicalGrid = fixture.componentInstance.hgrid;
    }));

    it(' should allow setting custom template for expand/collapse icons', async() => {
        let rows = hierarchicalGrid.dataRowList.toArray();
        for (const row of rows) {
            const expander =  row.nativeElement.querySelector('.igx-grid__hierarchical-expander');
            expect((expander as HTMLElement).innerText).toBe('COLLAPSED');
        }
        hierarchicalGrid.expandChildren = true;
        fixture.detectChanges();
        rows = hierarchicalGrid.dataRowList.toArray();
        for (const row of rows) {
            const expander =  row.nativeElement.querySelector('.igx-grid__hierarchical-expander');
            expect((expander as HTMLElement).innerText).toBe('EXPANDED');
        }

        const childGrid = hierarchicalGrid.hgridAPI.getChildGrids(false)[0];
        const childRows = childGrid.dataRowList.toArray();
        for (const row of childRows) {
            const expander =  row.nativeElement.querySelector('.igx-grid__hierarchical-expander');
            expect((expander as HTMLElement).innerText).toBe('COLLAPSED');
        }

        expect((hierarchicalGrid as any).headerHierarchyExpander.nativeElement.innerText).toBe('EXPANDED');
        expect((childGrid as any).headerHierarchyExpander.nativeElement.innerText).toBe('COLLAPSED');

        childRows[0].toggle();
        fixture.detectChanges();
        expect((childGrid as any).headerHierarchyExpander.nativeElement.innerText).toBe('EXPANDED');
        hierarchicalGrid.expandChildren = false;
        fixture.detectChanges();
        await wait(100);
        fixture.detectChanges();
        expect((hierarchicalGrid as any).headerHierarchyExpander.nativeElement.innerText).toBe('COLLAPSED');
    });
});

@Component({
    template: `
    <igx-hierarchical-grid #grid1 [data]="data"
     [autoGenerate]="false" [height]="'400px'" [width]="width" #hierarchicalGrid>
     <igx-column field="ID"></igx-column>
     <igx-column field="ProductName"></igx-column>
        <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland>
            <igx-column field="ID"></igx-column>
            <igx-column field="ProductName"></igx-column>
            <igx-column field="Col1"></igx-column>
            <igx-column field="Col2"></igx-column>
            <igx-column field="Col3"></igx-column>
            <igx-row-island [key]="'childData'" [autoGenerate]="true" #rowIsland2 >
            </igx-row-island>
        </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridTestBaseComponent {
    public data;
    public width = '500px';
    @ViewChild('hierarchicalGrid', { read: IgxHierarchicalGridComponent, static: true }) public hgrid: IgxHierarchicalGridComponent;
    @ViewChild('rowIsland', { read: IgxRowIslandComponent, static: true }) public rowIsland: IgxRowIslandComponent;
    @ViewChild('rowIsland2', { read: IgxRowIslandComponent, static: true }) public rowIsland2: IgxRowIslandComponent;

    constructor() {
        // 3 level hierarchy
        this.data = this.generateDataUneven(20, 3);
    }
    generateDataUneven(count: number, level: number, parendID: string = null) {
        const prods = [];
        const currLevel = level;
        let children;
        for (let i = 0; i < count; i++) {
            const rowID = parendID ? parendID + i : i.toString();
            if (level > 0 ) {
               // Have child grids for row with even id less rows by not multiplying by 2
               children = this.generateDataUneven((i % 2 + 1) * Math.round(count / 3) , currLevel - 1, rowID);
            }
            prods.push({
                ID: rowID, ChildLevels: currLevel,  ProductName: 'Product: A' + i, 'Col1': i,
                'Col2': i, 'Col3': i, childData: children, childData2: children });
        }
        return prods;
    }
}

@Component({
    template: `
    <igx-hierarchical-grid #grid1 [data]="data" [autoGenerate]="false" [height]="'400px'" [width]="'500px'" #hierarchicalGrid>
    <igx-column field="ID"></igx-column>
    <igx-column field="ProductName"></igx-column>
        <igx-row-island [key]="'childData'" [autoGenerate]="false" [height]="height" #rowIsland1>
            <igx-column field="ID"></igx-column>
            <igx-column field="ProductName"></igx-column>
        </igx-row-island>
        <igx-row-island [key]="'childData2'" [autoGenerate]="false" [height]="height" #rowIsland2>
            <igx-column field="Col1"></igx-column>
            <igx-column field="Col2"></igx-column>
            <igx-column field="Col3"></igx-column>
        </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridMultiLayoutComponent extends IgxHierarchicalGridTestBaseComponent {
    public height = '100px';
    @ViewChild('rowIsland1', { read: IgxRowIslandComponent, static: true }) public rowIsland1: IgxRowIslandComponent;
    @ViewChild('rowIsland2', { read: IgxRowIslandComponent, static: true }) public rowIsland2: IgxRowIslandComponent;
}

@Component({
    template: `
        <igx-hierarchical-grid [data]="data" [isLoading]="true" [autoGenerate]="true" [height]="'600px'">
            <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland1 (onGridCreated)="gridCreated($event, rowIsland1)">
                <igx-column field="ID"></igx-column>
                <igx-column field="ProductName"></igx-column>
                <igx-row-island [key]="'childData2'" [autoGenerate]="true" #rowIsland2>
                </igx-row-island>
            </igx-row-island>
        </igx-hierarchical-grid>
    `
})
export class IgxHGridRemoteOnDemandComponent {
    public data;

    @ViewChild(IgxHierarchicalGridComponent, { read: IgxHierarchicalGridComponent, static: true })
    public instance: IgxHierarchicalGridComponent;

    @ViewChild('rowIsland1', { read: IgxRowIslandComponent, static: true })
    public rowIsland: IgxRowIslandComponent;

    @ViewChild('rowIsland2', { read: IgxRowIslandComponent, static: true })
    public rowIsland2: IgxRowIslandComponent;

    constructor(public cdr: ChangeDetectorRef) { }

    generateDataUneven(count: number, level: number, parendID: string = null) {
        const prods = [];
        const currLevel = level;
        for (let i = 0; i < count; i++) {
            const rowID = parendID ? parendID + i : i.toString();
            prods.push({
                ID: rowID, ChildLevels: currLevel,  ProductName: 'Product: A' + i, 'Col1': i,
                'Col2': i, 'Col3': i });
        }
        return prods;
    }

    bind () {
        this.data = this.generateDataUneven(20, 3);
    }

    generateRowIslandData(count: number) {
        const prods = [];
        for (let i = 0; i < count; i++) {
            prods.push({ ID: i, ProductName: 'Product: A' + i });
        }
        return prods;
    }

    gridCreated(event: IGridCreatedEventArgs, rowIsland: IgxRowIslandComponent) {
        setTimeout(() => {
            event.grid.data = this.generateRowIslandData(5);
            event.grid.cdr.detectChanges();
        }, 1000);
    }
}

@Component({
    template: `
    <igx-hierarchical-grid #hierarchicalGrid [data]="data" [autoGenerate]="false" [height]="'500px'" [width]="'800px'" >
        <igx-column field="ID"></igx-column>
        <igx-column field="ProductName"></igx-column>
        <igx-column *ngFor="let colField of parentCols" [field]="colField"></igx-column>
        <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland [height]="'350px'">
            <igx-column *ngFor="let colField of islandCols1" [field]="colField"></igx-column>
            <igx-row-island [key]="'childData'" [autoGenerate]="false" #rowIsland2 [height]="'200px'">
                <igx-column *ngFor="let colField of islandCols2" [field]="colField"></igx-column>
            </igx-row-island>
        </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridColumnsUpdateComponent extends IgxHierarchicalGridTestBaseComponent implements AfterViewInit {
    public cols1 = ['ID', 'ProductName', 'Col1', 'Col2', 'Col3'];
    public cols2 =  ['ID', 'ProductName', 'Col1'];
    public parentCols = [];
    public islandCols1 = [];
    public islandCols2 = [];
    constructor(public cdr: ChangeDetectorRef) {
        super();
    }

    ngAfterViewInit() {
        this.islandCols1 = this.cols1;
        this.islandCols2 = this.cols2;
        this.cdr.detectChanges();
    }
}

@Component({
    template: `
    <igx-hierarchical-grid #grid1 [data]="data"
        [autoGenerate]="false" [height]="'600px'" [width]="'700px'" #hierarchicalGrid>
        <igx-column field="ID"></igx-column>
        <igx-column field="ProductName"></igx-column>
        <igx-row-island [key]="'childData'" [autoGenerate]="false" [width]="'500px'" [height]="childHeight" #rowIsland>
            <igx-column field="ID"></igx-column>
            <igx-column field="ProductName"></igx-column>
        </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridSizingComponent {
    public childHeight = '100%';
    public data = [
        {
            ID: 1,
            ProductName: 'Car'
        }
    ];
    public fullData = Array.from({ length: 100000 }, (_, i) => ({ 'ID': i, 'ProductName': 'PN' + i }));
    public semiData = Array.from({ length: 15 }, (_, i) => ({ 'ID': i, 'ProductName': 'PN' + i }));

    @ViewChild('hierarchicalGrid', { read: IgxHierarchicalGridComponent, static: true })
    public hgrid: IgxHierarchicalGridComponent;

    @ViewChild('rowIsland', { read: IgxRowIslandComponent, static: true })
    public rowIsland: IgxRowIslandComponent;
}

@Component({
    template: `
    <igx-hierarchical-grid #grid1 [data]="data"
     [autoGenerate]="true" [height]="'400px'" [width]="'500px'" #hierarchicalGrid>
     <igx-row-island *ngIf='toggleRI' [key]="'childData'" [autoGenerate]="true">
        <igx-row-island *ngIf='toggleChildRI' [key]="'childData'" [autoGenerate]="true">
        </igx-row-island>
     </igx-row-island>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridToggleRIComponent  extends IgxHierarchicalGridTestBaseComponent {
public toggleRI = true;
public toggleChildRI = true;

}

@Component({
    template: `
    <igx-hierarchical-grid #grid1 [data]="data" [showExpandAll]='true'
     [autoGenerate]="false" [height]="'400px'" [width]="width" #hierarchicalGrid>
     <igx-column field="ID"></igx-column>
     <igx-column field="ProductName"></igx-column>
        <igx-row-island [showExpandAll]='true' [key]="'childData'" [autoGenerate]="false" #rowIsland>
            <igx-column field="ID"></igx-column>
            <igx-column field="ProductName"></igx-column>
            <igx-row-island [key]="'childData'" [autoGenerate]="true" #rowIsland2 >
            </igx-row-island>
        </igx-row-island>
        <ng-template igxRowExpandedIndicator>
                <span>EXPANDED</span>
        </ng-template>
        <ng-template igxRowCollapsedIndicator>
                <span>COLLAPSED</span>
        </ng-template>
        <ng-template igxHeaderCollapsedIndicator>
            <span>COLLAPSED</span>
        </ng-template>
        <ng-template igxHeaderExpandedIndicator>
            <span>EXPANDED</span>
        </ng-template>
    </igx-hierarchical-grid>`
})
export class IgxHierarchicalGridCustomTemplateComponent extends IgxHierarchicalGridTestBaseComponent {}

