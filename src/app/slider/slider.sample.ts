import { Component } from '@angular/core';
import { SliderType, ISliderValueChangeEventArgs, IRangeSliderValue } from 'igniteui-angular';

class Task {
    title: string;
    percentCompleted: number;

    constructor(title: string, percentCompeted: number) {
        this.title = title;
        this.percentCompleted = percentCompeted;
    }
}

@Component({
    selector: 'app-slider-sample',
    styleUrls: ['slider.sample.scss'],
    templateUrl: 'slider.sample.html'
})
export class SliderSampleComponent {
    private _lowerValue: Date;
    private _upperValue: Date;
    sliderType: SliderType = SliderType.RANGE;

    rangeValue = {
        lower: 30,
        upper: 60
    };

    rangeLabel = {
        lower: 2,
        upper: 5
    };

    labels = new Array<Date>();
    constructor() {
        for (let i = 0; i <= 500; i++) {

            this.labels.push(new Date(2019, 10, i));
        }
    }

    public get getLowerVal() {
        return this._lowerValue
    }

    public get getUpperVal() {
        return this._upperValue;
    }

    valueChange(evt: ISliderValueChangeEventArgs) {
        this._lowerValue = this.labels[(evt.value as IRangeSliderValue).lower];
        this._upperValue = this.labels[(evt.value as IRangeSliderValue).upper];
    }

    task: Task = new Task('Implement new app', 30);
}
