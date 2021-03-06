/*  Raspberry Pi Dasboard
 *  =====================
 *  Copyright 2014 Domen Ipavec <domen.ipavec@z-v.si>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

registerPage({
    path: '/network',
    route: {
        templateUrl: 'partials/network.html',
        controller: 'NetworkController'
    },
    accessDependencies: ['network', 'logger'],
    title: "Network",
    description: "Show network configuration and usage with history graphs."
});

networkData = {};
networkData.list = {};
networkData.ready = false;
networkData.throughputRequestOptions = {
    rate: true,
    format: []
};
backgroundUpdate(['network', 'logger'], 1000, function(done) {
    if (!networkData.ready) {
        $.rpijs.get("network/list", function(data) {
            angular.forEach(data, function(value, name) {
                networkData.list[name] = value;
                networkData.throughputRequestOptions.format.push({
                    key: ["rx", name],
                    rate: true
                });
                networkData.throughputRequestOptions.format.push({
                    key: ["tx", name],
                    rate: true
                });
                networkData.list[name].throughput = {
                    rx: vObject(0),
                    tx: vObject(0)
                };
                networkData.list[name].history = historyGraph(
                    "AreaChart",
                    [
                        {
                            id: "tx",
                            label: "Transmit",
                            type: "number"
                        },
                        {
                            id: "rx",
                            label: "Receive",
                            type: "number"
                        }
                    ],
                    {
                        lineWidth: 1
                    },
                    bpsFilter,
                    "network-bytes-tx-"+name+"~network-bytes-rx-"+name
                );
            });
            networkData.ready = true;
            done.resolve();
        });
        return;
    }
    $.rpijs.get("network/bytes", function(data) {
        angular.forEach(data.rx, function(value, name) {
            networkData.list[name].throughput.rx.v = value;
            networkData.list[name].throughput.rx.f = bpsFilter(value);
        });
        angular.forEach(data.tx, function(value, name) {
            networkData.list[name].throughput.tx.v = value;
            networkData.list[name].throughput.tx.f = bpsFilter(value);
            networkData.list[name].history.add([
                networkData.list[name].throughput.tx.v,
                networkData.list[name].throughput.rx.v
            ]);
        });
        done.resolve();
    }, networkData.throughputRequestOptions);
});

rpiDashboard.controller('NetworkController', ['$scope', function($scope) {
    $scope.list = networkData.list;
}]);
