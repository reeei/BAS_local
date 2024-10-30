sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'project1',
            componentId: 'ZC_GeneralJournalEntryObjectPage',
            contextPath: '/ZC_GeneralJournalEntry'
        },
        CustomPageDefinitions
    );
});