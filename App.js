Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
        
        { 
            xtype :'container',
            itemId : 'mainContainer',
            layout : 'vbox',
            padding :10
        }
    ],
    
    appWorkspace: null,
    appPrefName: 'buildList7',
    appPref: null,
    buildCombobox : null,
    rCB : null,
    launch: function() {

        var buildAddContainer = Ext.create ('Ext.container.Container', {
            itemId: 'bAddContainer',
            layout : 'vbox',
            width : 600,
            height : 160,
            border: '0 0 1 0',
            style: {
                borderColor: 'grey',
                borderStyle: 'solid'
            },
            padding : '0 0 10 0'

        });
        var buildAddContainerInner = Ext.create ('Ext.container.Container', {
            itemId: 'bAddContainerInner',
            layout : 'vbox'

        });

        this.buildRemoveContainer = Ext.create ('Ext.container.Container', {
            itemId: 'bRemoveContainer',
            layout : 'vbox',
            width : 600,
            height : 60,
            padding : '10 0 0 0'

        });

        var buildDateContainer = Ext.create ('Ext.container.Container', {
            itemId: 'bDateContainer',
            layout : 'hbox'
        });

        this.appWorkspace = this.getContext().getWorkspaceRef();
        

        
        var tfKey = Ext.create('Rally.ui.TextField',
        {
            itemId: 'tfK',
            fieldLabel : 'Build Number',
            padding : 10

        });

        var dfValue = Ext.create('Rally.ui.DateField',
        {
            itemId: 'dfV',
            fieldLabel : 'Build Date',
            value: new Date(),
            padding : 10
        });
        var tfValue = Ext.create('Ext.form.field.Time',
        {
            itemId: 'tfV',
            fieldLabel : 'Build Time (24 hour style)',
            maxValue : '23:59',
            minValue : '0:00',
            increment :15,
            format :'H:i',
            value: new Date(),
            padding : 10
        });

        var buttonAdd = Ext.create('Rally.ui.Button',
        
        {
            text: 'Add Build',
            width : 100,
            handler: this._onButtonAddClick,
            scope : this

        });
        this.rCB = Ext.create('Rally.ui.combobox.ReleaseComboBox',{
            itemId: 'relCB',
            listeners: {
                /*ready : function(rCombobox){
                    console.log('ready');
                    buildAddContainer.add(buttonAdd);
                //console.log('release chosen', this.rCB.findRecordByValue(this.rCB.getValue()).get('ReleaseDate'));
                this._displayGrid();
                
                
                },*/
                change : function (){
                    
                    buildAddContainer.add(buttonAdd);

                    console.log ('changed');
                    this._displayGrid();
                },
                scope : this
            
            }
        
        });
        //console.log (rCB);

        
        //add build date and time text fields to build date container
        buildDateContainer.add(dfValue);
        buildDateContainer.add(tfValue);


        //add build number textfield, build date container and build add button to build add container
        buildAddContainerInner.add(this.rCB);
        buildAddContainerInner.add(tfKey);
        buildAddContainerInner.add(buildDateContainer);
        buildAddContainerInner.add(buttonAdd);
        
        buildAddContainer.add(buildAddContainerInner);
        
        
        
        //add all containers to maincontainer
        
        this.down('#mainContainer').add(buildAddContainer);
        this.down('#mainContainer').add(this.buildRemoveContainer);


        
    },
    
    _onButtonRemoveClick : function (){
        
        //filter the collection of objects and save it without the chosen one to get removed
        var buildToRemove = this.buildCombobox.getRawValue();
        
        if (buildToRemove !=='')
        {
            console.log ('build to remove', buildToRemove);
            
            //filter out 
            var newList = _.filter(this.appPrefValue, function (num) { return num.build !=buildToRemove;});
            console.log ('removed build list', newList);
            
            this._saveNewPrefs(newList);
        }


        
    },

    _onButtonAddClick: function(){
        
        var buildKey=this.down('#tfK').getValue();
        
        if (buildKey !=='')
       {
           console.log ('build', buildKey);
            var buildDateValue=this.down('#dfV').getValue();
            var buildTimeValue=this.down('#tfV').getValue();
            
    
            var buildTimeStamp=new Date(buildDateValue.getFullYear()+'-'+(buildDateValue.getMonth()+1)+'-'+buildDateValue.getDate()+' '+buildTimeValue.getHours()+':'+buildTimeValue.getMinutes()+
            
            ':'+buildTimeValue.getSeconds());
    
            console.log ('stamp', buildTimeStamp);
            console.log ('buildDateValue',buildDateValue);
            console.log ('month',buildDateValue.getMonth());
            console.log ('day',buildDateValue.getDate());
            console.log('appPrefValue init', this.appPrefValue);
            var chosenRelease = this.rCB.getValue();
            
            this.appPrefValue.push({'build' : buildKey, 'date' : buildTimeStamp.toISOString(), 'release': chosenRelease});
    
            console.log ('buildTimestamp to string',buildTimeStamp.toISOString());
            
            console.log ('this.appPrefValue',this.appPrefValue);
            
            this._saveNewPrefs(this.appPrefValue);
       }
        

    },
    
    _saveNewPrefs : function (prefValue){
        
        var appPrefValueEncoded = Ext.JSON.encode(prefValue);
    
        // resave entire pref again with new build
        var newPref = {};
        newPref[this.appPrefName] = appPrefValueEncoded;

        console.log('newPref', newPref);
        Rally.data.PreferenceManager.update({
            settings: newPref,
            workspace: this.appWorkspace,
            success: function(updatedRecords, notUpdatedRecords) {
                console.log ('Pair saved', updatedRecords);
                console.log('this',this);

                this._displayGrid();
            },
            scope : this
        });
    },
    
    _displayGrid : function (){
        
        if (this.prefGrid)
        {
            this.prefGrid.destroy();
            console.log('grid destroyed');
        }
        console.log(this.down('#grid'));
        Rally.data.PreferenceManager.load({
            workspace: this.appWorkspace,
            filterByName: this.appPrefName,
            success: function(pref) {
                console.log('loaded pref', pref, pref[this.appPrefName]);
                var decodedPrefValue = Ext.JSON.decode(pref[this.appPrefName]);
                this.appPrefValue = (decodedPrefValue === undefined) ? [] : decodedPrefValue;
                console.log('decoded pref value', this.appPrefValue);
                
                
                var relEndDate = this.rCB.findRecordByValue(this.rCB.getValue()).get('ReleaseDate').toISOString();
                var relStartDate = this.rCB.findRecordByValue(this.rCB.getValue()).get('ReleaseStartDate').toISOString();
                var relValue=this.rCB.getValue();
                
                console.log ('release start date', relStartDate);
                console.log ('release end date', relEndDate);
                
                
                //filter original array of objects returned by the preference read and add only objects that have date key value within release chosen timebox
                
                
                this.relBuildsPrefValues = _.filter(this.appPrefValue,function(obj){
                    return (obj.release === relValue);
                    
                });
                console.log ('filtered builds',this.relBuildsPrefValues );

                var prefStoreRelease = Ext.create("Rally.data.custom.Store", {
                    //data: this.appPrefValue,
                    data: this.relBuildsPrefValues,

                    storeId: 'pStore',
                    columnCfgs: [
                        {
                            text: 'Build', dataIndex: 'build'
                        },
                        {
                            text: 'Build Timestamp', dataIndex: 'date'
                        }
                    ]
                
                });
                //add combobox +button to remove build with button after destroying it if exists
                
                if (this.buildCombobox)
                    {
                        this.buildCombobox.destroy();
                        this.buttonRemove.destroy();
                    }
                    
                this.buildCombobox  = Ext.create('Ext.form.ComboBox', {
                    fieldLabel: 'Choose Build',
                    itemId: 'buildToRemoveCB',
                    store: prefStoreRelease,
                    //queryMode: 'local',
                    displayField: 'build',
                    valueField: 'date',
                    renderTo: Ext.getBody(),
                    scope : this
                });
                
                this.buttonRemove = Ext.create('Rally.ui.Button',{
                    text: 'Remove Build',
                    width : 100,
                    handler: this._onButtonRemoveClick,
                    scope : this
        
                });
                


                //add to build remove container
                this.down('#bRemoveContainer').add(this.buildCombobox);
                this.down('#bRemoveContainer').add(this.buttonRemove);

                
                //console.log ('prefstore', prefStore);
                console.log('retrieved store',Ext.data.StoreManager.lookup('pStore'));
                
                this.prefGrid = Ext.create ('Rally.ui.grid.Grid',{
                    itemId:'grid',
                    store: Ext.data.StoreManager.lookup('pStore'),
                    title:'BUILD HISTORY',
                    columnCfgs: [
                                {text: 'Build', dataIndex : 'build', flex: 1},
                                {text : 'Build Timestamp', dataIndex : 'date', flex: 5}
                    ],
                    rowLines : true,
                    showPagingToolbar : false,
                    columnLines:true
                
                });
                console.log('grid found',this.prefGrid);

                this.add(this.prefGrid);
                
            },
            scope: this
        });
 
           
        
    }
});
