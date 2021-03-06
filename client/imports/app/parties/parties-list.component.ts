import {Component, OnInit, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {MeteorObservable} from "meteor-rxjs";

import {Parties} from '../../../../both/collections/parties.collection';
import {Party} from '../../../../both/models/party.model';

import template from './parties-list.component.html';
import {Subject} from "rxjs/Subject";
import {PaginationService} from "ng2-pagination";
import {Counts} from "meteor/tmeasday:publish-counts";

interface Pagination {
    limit: number;
    skip: number;
}

interface Options extends Pagination {
    [key: string]: any
}

@Component({
    selector: 'parties-list',
    template
})
export class PartiesListComponent implements OnInit, OnDestroy{
    parties: Observable<Party[]>;
    partiesSub: Subscription;
    pageSize: Subject<number> = new Subject<number>();
    curPage: Subject<number> = new Subject<number>();
    nameOrder: Subject<number> = new Subject<number>();
    optionsSub: Subscription;
    partiesSize: number = 0;
    autorunSub: Subscription;

    constructor(private paginationService: PaginationService) {
    }

    //constructor 에서 ngOnInit으로
    ngOnInit() {
        this.optionsSub = Observable.combineLatest(
            this.pageSize,
            this.curPage,
            this.nameOrder
        ).subscribe(([pageSize, curPage, nameOrder])=> {
            const options: Options = {
                limit: pageSize as number,
                skip: ((curPage as number) - 1) * (pageSize as number),
                sort: {name: this.nameOrder as number}
            };

            this.paginationService.setCurrentPage(this.paginationService.defaultId, curPage as number);

            if (this.partiesSub) {
                this.partiesSub.unsubscribe();
            }
            this.partiesSub = MeteorObservable.subscribe('parties').subscribe(()=> {
                this.parties = Parties.find({}, {
                    sort: {
                        name: this.nameOrder
                    }
                }).zone();
            });
        });

        this.paginationService.register({
            id: this.paginationService.defaultId,
            itemsPerPage: 10,
            currentPage: 1,
            totalItems: this.partiesSize,
        });

        this.pageSize.next(10);
        this.curPage.next(1);
        this.nameOrder.next(1);

        this.autorunSub = MeteorObservable.autorun().subscribe(()=>{
            this.partiesSize = Counts.get('numberOfParties');
            this.paginationService.setTotalItems(this.paginationService.defaultId, this.partiesSize);
        });
    }

    removeParty(party: Party): void {
        Parties.remove(party._id);
    }

    search(value: string): void {
        this.parties = Parties.find(value ? {location: value} : {}).zone();
    }

    onPageChanged(page: number):void{
        this.curPage.next(page);
    }

    changeSortOrder(nameOrder : string):void {
        this.nameOrder.next(parseInt(nameOrder));
    }
    ngOnDestroy() {
        this.partiesSub.unsubscribe();
        this.optionsSub.unsubscribe();
    }
}
