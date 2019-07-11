import { Component, ViewChild, OnInit } from '@angular/core';
import { IgxButtonDirective, IgxListComponent, IgxTransactionService, Transaction, State, TransactionType } from 'igniteui-angular';
import { IEmployee, employeeItems } from "./data";

@Component({
    selector: 'app-list-sample',
    styleUrls: ['list.sample.css'],
    templateUrl: 'list.sample.html'
})
export class ListSampleComponent {
    @ViewChild('contactsList', { static: true })
    contactsList: IgxListComponent;

    @ViewChild('add', { static: false })
    public add: IgxButtonDirective;
    public employee: IEmployee[];
    public position: string;
    public name: string;
    public type: string;
    public transactions: Transaction[] = [];

    constructor(private _transactions: IgxTransactionService<Transaction, State>) {
        this.employee = employeeItems;
    }

    public onAdd(event): void {
        this.add.disabled = true;
        const employee: IEmployee = { name: 'Malin Gerginov', position: 'QA architect' };
        this._transactions.add({ id: 2, type: TransactionType.ADD, newValue: employee });

        /** visualization */
        this.position = employee.position;
        this.name = employee.name;
        this.type = 'Add';
    }

    public onEdit(event): void {
        const newPosition = 'Developer advocate';
        this._transactions.add({ id: 3, type: TransactionType.UPDATE, newValue: { position: newPosition } }, this.employee[1]);

        /** visualization */
        this.name = this.employee[1].name;
        this.position = newPosition;
        this.type = 'Edit';
    }

    public onDelete(event): void {
        /** visualization */
        this.name = this.employee[0].name;
        this.position = this.employee[0].position;
        this.type = 'Delete';
        /** */

        this._transactions.add(
            { id: 1, type: TransactionType.DELETE, newValue: { position: this.position } }, this.employee[0]);
    }

    public onClear(event): void {
        this._transactions.clear();

        /** visualization */
        this.name = null;
        this.position = null;
    }

    public onCommit(event): void {
        this._transactions.commit(this.employee);

        /** visualization */
        this.name = null;
        this.position = null;
        this.type = null;
    }
}
