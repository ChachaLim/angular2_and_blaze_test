import { MongoObservable } from 'meteor-rxjs';

import { Party } from '../models/party.model';
import { Meteor } from 'meteor/meteor';

export const Parties = new MongoObservable.Collection<Party>('parties');

function loggedIn(){
    return !!Meteor.user();
}

Parties.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});