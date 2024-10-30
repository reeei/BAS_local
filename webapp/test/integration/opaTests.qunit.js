sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'project1/test/integration/FirstJourney',
		'project1/test/integration/pages/ZC_GeneralJournalEntryList',
		'project1/test/integration/pages/ZC_GeneralJournalEntryObjectPage',
		'project1/test/integration/pages/ZC_GeneralJournalEntryItemObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_GeneralJournalEntryList, ZC_GeneralJournalEntryObjectPage, ZC_GeneralJournalEntryItemObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('project1') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_GeneralJournalEntryList: ZC_GeneralJournalEntryList,
					onTheZC_GeneralJournalEntryObjectPage: ZC_GeneralJournalEntryObjectPage,
					onTheZC_GeneralJournalEntryItemObjectPage: ZC_GeneralJournalEntryItemObjectPage
                }
            },
            opaJourney.run
        );
    }
);