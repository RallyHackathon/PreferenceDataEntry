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
    appPrefName: 'buildList6',
    appPref: null,
    buildCombobox : null,

    launch: function() {

        var buildAddContainer = Ext.create ('Ext.container.Container', {
            itemId: 'bAddContainer',
            layout : 'vbox',
            width : 600,
            height : 120,
            border: '0 0 1 0',
            style: {
                borderColor: 'grey',
                borderStyle: 'solid'
            }

        });

        this.buildRemoveContainer = Ext.create ('Ext.container.Container', {
            itemId: 'bRemoveContainer',
            layout : 'vbox',
            width : 600,
            height : 60

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
            fieldLabel : 'Build Time',
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
        

        
        
        //add build date and time text fields to build date container
        buildDateContainer.add(dfValue);
        buildDateContainer.add(tfValue);


        //add build number textfield, build date container and build add button to build add container
        buildAddContainer.add(tfKey);
        buildAddContainer.add(buildDateContainer);
        buildAddContainer.add(buttonAdd);
        
        
        
        //add all containers to maincontainer
        
        this.down('#mainContainer').add(buildAddContainer);
        this.down('#mainContainer').add(this.buildRemoveContainer);
        
        
        

        this._displayGrid();

        
    },
    
    _onButtonRemoveClick : function (){
        
        //filter the collection of objects and save it without the chosen one to get removed
        console.log (this.buildCombobox);
        var buildToRemove = this.buildCombobox.getRawValue();
        console.log ('build to remove', buildToRemove);
        
        //filter out 
        var newList = _.filter(this.appPrefValue, function (num) { return num.build !=buildToRemove;});
        console.log ('removed build list', newList);
        
        this._saveNewPrefs(newList);


        
    },

    _onButtonAddClick: function(){
        
        var buildKey=this.down('#tfK').getValue();
        
        var buildDateValue=this.down('#dfV').getValue();
        var buildTimeValue=this.down('#tfV').getValue();
        

        var buildTimeStamp=new Date(buildDateValue.getFullYear()+'-'+(buildDateValue.getMonth()+1)+'-'+buildDateValue.getDate()+' '+buildTimeValue.getHours()+':'+buildTimeValue.getMinutes()+
        
        ':'+buildTimeValue.getSeconds());

        console.log ('stamp', buildTimeStamp);
        console.log ('buildDateValue',buildDateValue);
        console.log ('month',buildDateValue.getMonth());
        console.log ('day',buildDateValue.getDate());
        console.log('appPrefValue init', this.appPrefValue);
        
        this.appPrefValue.push({'build' : buildKey, 'date' : buildTimeStamp.toISOString()});

        console.log ('buildTimestamp to string',buildTimeStamp.toISOString());
        
        this._saveNewPrefs(this.appPrefValue);
        

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
                var prefStore = Ext.create("Rally.data.custom.Store", {
                    data: this.appPrefValue,
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
                    store: prefStore,
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

                
                console.log ('prefstore', prefStore);
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
