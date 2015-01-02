/**
 * 
 */
angular.module('treemodule', []).directive('treeview', function($compile){
	return {
		link:function(scope, element, attrs, controller, transcludefn)
		{
			var label = attrs['treeviewLabel'];
			var id = attrs['treeviewId'];
			var children = attrs['treeviewChild'];
			var sourceName = attrs['treeviewSource'];
			var targetName = attrs['treeviewTarget'];
			var checkChildStateAll = function(master, state)
			{
				var next = master.$$childHead; 
				while(next)
				{
					if(next.data.checked != state)
						return false;				
					
					next = next.$$nextSibling;
				};
				return true;
			};
			var checkChildStateSome = function(master, state)
			{
				var next = master.$$childHead; 
				while(next)
				{
					if(next.data.checked == state)
						return true;				
					
					next = next.$$nextSibling;
				};
				return false;
			};
			var setState = function(master)
			{
				var ok = checkChildStateSome(master, 1);				
				var sp = checkChildStateSome(master, -1);
				if((ok || sp) && master.data.checked != 1)
					master.data.checked = -1;
				else
					if(!ok && !sp && master.data.checked != 1)
						master.data.checked = 0;
			};
			var watchFunction = function(newNames, oldNames) {			  
				
			var source = scope.$eval(sourceName);
			var target = scope.$eval(targetName);
			
			var mainElement = angular.element('<ul class="tree-main"></ul>');
			$(element).children().empty();
			
			var createTree = function(mainElement, mainScope, data)
			{
				
				for(var i = 0; i<data.length;i++)
				{
					(function(){
					var childScope = mainScope.$new();
					childScope.data = data[i];
					
					var checked = 0;
					if(target)
					for(var k = 0; k < target.length; k++)
					{
						if(data[i][id] == target[k][id])
						{
							checked = 1;
							break;
						}
					}
					childScope.data.checked = checked;					
					
					var child = null;
					if(data[i][children] && data[i][children].length > 0 )
					{
						child = angular.element('<li><div><span class="tree-span tree-span-collapsed"></span><input type="checkbox" class="tree-checkbox" ng-indeterminate="data.checked"/><label>{{data.'+label+'}}</label><div class="tree-content-collapsed"><ul style="list-style-type:none;"></ul></div></div></li>');
						var child = $compile(child)(childScope);
						createTree($('ul', $('.tree-content-collapsed', child)), childScope, data[i][children]);
						setState(childScope);
					}						
					else
						{
							child = angular.element('<li><div><span class="tree-span tree-span-none" ></span><input type="checkbox" class="tree-checkbox" ng-indeterminate="data.checked"/><label>{{data.'+label+'}}</label><div class="tree-content-collapsed"></div></div></li>');
							var child = $compile(child)(childScope);
						}					
					childScope.$watch('data.checked', function(newval, oldval){
						if(childScope.clicked)
						{
							childScope.$emit('checkStateChangedChild', newval);
							childScope.$broadcast('checkStateChangedMaster', newval);
						}
					});
					childScope.$on('checkStateChangedChild', function(event, data){
						if(!childScope.clicked)
						{
							setState(childScope);
						}
					});
					childScope.$on('checkStateChangedMaster', function(event, data){
						if(!childScope.clicked)
						{							
							childScope.data.checked = data;
						}
					});
					mainElement.append(child);
					})();
				}
			};
			
			createTree(mainElement, scope, source);
			element.append(mainElement);
			var collapseExpandfunction = function(el)
			{
				el = el.currentTarget;
				console.info('click basarili');
				if($(el).hasClass('tree-span-expanded'))
				{
					$(el).removeClass('tree-span-expanded');
					$(el).addClass('tree-span-collapsed');					
					var content = $(el).siblings('.tree-content-expanded');
					content.removeClass('tree-content-expanded');
					content.addClass('tree-content-collapsed');
				}
				else
					{
						$(el).removeClass('tree-span-collapsed');
						$(el).addClass('tree-span-expanded');
						var content = $(el).siblings('.tree-content-collapsed');
						content.removeClass('tree-content-collapsed');
						content.addClass('tree-content-expanded');
					}
			};
			$('.tree-span-collapsed').on('click', collapseExpandfunction);
			$('.tree-span-expanded').on('click', collapseExpandfunction);
			};
			scope.$watch(sourceName, watchFunction);
			scope.$watch(targetName, watchFunction);
		}
	};
}).directive('ngIndeterminate', function($parse, $rootScope){
	return{		
		link:function(scope, element, attrs)
		{
			(function()
			{
			scope.clicked = false;
			scope.$watch(attrs['ngIndeterminate'], function(newval, oldval){		
			
				if(newval == 1)
				{
					element.toArray()[0].indeterminate = false;
					element.prop('checked', true);					
				}
				else
					if(newval == 0)
					{
							element.toArray()[0].indeterminate = false;
							element.prop('checked', false);
					}
					else
					{
							element.toArray()[0].indeterminate = true;
					}
				
			});
			
			element.on('click', function(event){
				var element = event.currentTarget;
				scope.clicked = true;
				scope.$apply(function(){				
					var exp = $parse(attrs['ngIndeterminate']);
					var setter = exp.assign;
					setter(scope, ($(element).prop('checked')?1:0));
				});				
				scope.clicked = false;
			});
			})();
		}
		
	};
}).directive('datasTable', function($compile){
	return {
		scope:true,
		link:function(scope, element, attrs, controller, transcludefn)
		{
			var sourceName = attrs['source'];
			var rowcount =  attrs['rowCount'];
			var columns = eval(attrs['columns']);			
			var MainObject = scope.MainObject;
			var currentPage = 1;			
			var totalRowCount = 0;
			scope.setPage = function(pageNumber){
				
				if(pageNumber > scope.currentScope)
					return;
				
				currentPage = pageNumber;
				createTable();
			};
			var fetchCount = function()
			{
				var tst = new MainObject();
				MainObject.count({whereCondition:scope.whereCondition}).$promise.then(function(data){
					totalRowCount = data.count;
					currentPage = 1;
					createTable();
				},  function(data){ 
					
				
					if(data.status=='404')
					{
						scope.$parent.mainObjectList = [];
						scope.$parent.exceptionhandler({data:'Aradiginiz kriterlere uygun kayit bulunamadi!', status:'500'}); 
					}
					else
					{
						scope.$parent.exceptionhandler(data); 
					}
				});
			};
			var createTable = function()
			{
				MainObject.search({whereCondition:scope.whereCondition, firstResult:((currentPage-1)*rowcount), maxResult:rowcount}).$promise.then(function(data){
				var source = data;
				scope.$parent.mainObjectList = data;
				$(element).empty();				
				var table = angular.element('<table class="table table-striped table-bordered table-hover"><thead><tr></tr></thead><tbody></tbody><tfoot></tfoot></table>');
				var headRow = $('tr', table);
				var tbody = $('tbody', table);
				var tfoot = $('tfoot', table);
				for(var i = 0; i< columns.length; i++)
				{
					var headItem = angular.element('<th>'+columns[i].label+'</th>');
					headRow.append(headItem);					
				}
				
				var headItem = angular.element('<th>Operations</th>');
				headRow.append(headItem);
				
				var pagecount = Math.floor(totalRowCount / rowcount); 
				
				if(totalRowCount % rowcount != 0)
					pagecount++;
				
				for(var i = 0 ; i< source.length; i++)
				{
					var childScope = scope.$new();
					childScope.detailObject = source[i];					
					var row = angular.element('<tr></tr>');
					for(var j = 0 ;j < columns.length; j++)
					{						
						var rowItem = angular.element('<td>{{detailObject.'+columns[j].value+'}}</td>');
						row.append(rowItem);
					}						
					var rowItem = angular.element('<td><ng-include src="\'/sayfalar/genel/searchTableButtonPanel.html\'" /></td>');
					row.append(rowItem);
					row = $compile(row)(childScope);
					tbody.append(row);
				}
				
				if(pagecount > 1)
				{
					var row = angular.element('<tr><td colspan="'+(columns.length+1)+'" style="text-align: center;"><ul class="pagination"></ul></td></tr>');					
					var paginator = $('ul', row);
					var item = angular.element('<li><a ng-click="setPage(1)">&laquo;</a></li>');
					item = $compile(item)(scope);
					paginator.append(item);					
					for(var j = 0;j<pagecount;j++)
					{
						var activePage = '';
						if((j+1) == currentPage)
							activePage = 'class="active"';	
						var item = angular.element('<li '+activePage+'><a ng-click="setPage('+(j+1)+')">'+(j+1)+'</a></li>');
						item = $compile(item)(scope);
						paginator.append(item);
					}
					var item = angular.element('<li><a ng-click="setPage('+pagecount+')">&raquo;</a></li>');
					item = $compile(item)(scope);
					paginator.append(item);					
					
					tfoot.append(row);
				}
				
				element.append(table);
				}, function(data){ 
					
				
					if(data.status=='404')
					{
						scope.$parent.mainObjectList = [];
						scope.$parent.exceptionhandler({data:'Aradiginiz kriterlere uygun kayit bulunamadi!', status:'500'}); 
					}
					else
					{
						scope.$parent.exceptionhandler(data); 
					}
				});
			};
			
			var watchFunction = function(newval , oldval)
			{
				fetchCount();
			};
//			scope.$watchCollection(sourceName, watchFunction);
//			scope.$watch(sourceName, watchFunction);
			scope.$watch('whereCondition', watchFunction);
			scope.$on('list', function(){fetchCount()});
		}
	};
		
});