Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
        { 
            xtype :'container',
            itemId : 'textFieldsContainer',
            layout : 'hbox'
        },
        {
            xtype:'container',
            itemId : 'textFieldsBuildTimeContainer',
            layout : {
                    type :'hbox',
            }
            
        },
        {
            xtype:'container',
            itemId : 'buttonsContainer',
            layout : {
                    type :'hbox',
            }
            
        }
    ],
    
    appWorkspace: null,
    appPrefName: 'buildList5',
    appPref: null,
    
    launch: function() {
        
        this.appWorkspace = this.getContext().getWorkspaceRef();
        
        var tfKey = Ext.create('Rally.ui.TextField',
        {
            itemId: 'tfK',
            fieldLabel : 'Build Number'

        });
        

        
        var dfValue = Ext.create('Rally.ui.DateField',
        {
            itemId: 'dfV',
            fieldLabel : 'Build Date',
            value: new Date()
        });
        var tfValue = Ext.create('Ext.form.field.Time',
        {
            itemId: 'tfV',
            fieldLabel : 'Build Time',
            maxValue : '23:59',
            minValue : '0:00',
            increment :15,
            format :'H:i',
            value: new Date()
        });

        
        this.down('#textFieldsContainer').add(tfKey);
        this.down('#textFieldsBuildTimeContainer').add(dfValue);
        this.down('#textFieldsBuildTimeContainer').add(tfValue);
        
        
        var button = Ext.create('Rally.ui.Button',
        
        {
            text: 'Add Build Pair',
            handler: this._onButtonClick,
            scope : this
        });
        
        this.down('#buttonsContainer').add(button);
        
        
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
                
                console.log ('prefstore', prefStore);
                
                console.log('retrieved store', Ext.data.StoreManager.lookup('pStore'));
                var prefGrid = Ext.create ('Rally.ui.grid.Grid',{
        			itemId:'grid',
        			store: Ext.data.StoreManager.lookup('pStore'),
        			title:'BUILD HISTORY',
        			columnCfgs: [
                                {text: 'Build', dataIndex : 'build', flex: 1},
                                {text : 'Build Timestamp', dataIndex : 'date', flex: 5},
        			],
        			
        			showPagingToolbar : false,
        			columnLines:true
                
                });
                
                this.add(prefGrid);
                
            },
            scope: this
        });
        

        
    },
    _onButtonClick: function(){
        
        var buildKey=this.down('#tfK').getValue();
        
        var buildDateValue=this.down('#dfV').getValue();
        var buildTimeValue=this.down('#tfV').getValue();
        

        var buildTimeStamp=new Date(buildDateValue.getFullYear()+'-'+(buildDateValue.getMonth()+1)+'-'+(buildDateValue.getDay()+1)+' '+buildTimeValue.getHours()+':'+buildTimeValue.getMinutes()+
        
        ':'+buildTimeValue.getSeconds());


        console.log('appPrefValue init', this.appPrefValue);
        
        this.appPrefValue.push({'build' : buildKey, 'date' : buildTimeStamp.toISOString()});

        console.log (buildTimeStamp.toISOString());

        var appPrefValueEncoded = Ext.JSON.encode(this.appPrefValue);
    
        // resave entire pref again with new build
        var newPref = {};
        newPref[this.appPrefName] = appPrefValueEncoded;

        console.log('newPref', newPref);

        Rally.data.PreferenceManager.update({
            settings: newPref,
            workspace: this.appWorkspace,
            success: function(updatedRecords, notUpdatedRecords) {
                console.log ('Pair saved', updatedRecords);
            }
        });
        
        
    }
});
