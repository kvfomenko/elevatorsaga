{
    init: function(elevators, floors) {
        var min_load = [0, 0, 0, 0, 0, 0, 0, 0];
        var floors_queue = [];
        var floors_queue_el = [];

        function remove_floor_from_queue(el_num, floor) {
            for (let i = 0; i < floors_queue_el[el_num].length; i++) {
                if (floors_queue_el[el_num][i] == floor) {
                    floors_queue_el[el_num].splice(i, 1);
                    break;
                }
            }
            for (let i = 0; i < floors_queue.length; i++) {
                if (floors_queue[i] == floor) {
                    floors_queue.splice(i, 1);
                    break;
                }
            }
        }

        function check_stop_btw(el_num, to_floor, is_next_floor_from_elevator) {
            var floor = elevators[el_num].currentFloor();
            var load = elevators[el_num].loadFactor();

            //restore queue before
            if (is_next_floor_from_elevator) {
                floors_queue_el[el_num].unshift(to_floor);
            }

            var temp_queue_el = structuredClone(floors_queue_el[el_num]);
            temp_queue_el.sort();
            var temp_queue = structuredClone(floors_queue);
            temp_queue.sort();
            if (floor < to_floor) {
                //UP
                for (let f = floor + 1; f < to_floor; f++) {
                    if (temp_queue_el.includes(f)) {
                        if (!temp_queue_el.includes(to_floor)) {
                            floors_queue_el[el_num].push(to_floor);
                        }
                        console.log(el_num + "|stop_found_el|UP," + to_floor + "," + f + " " + floors_queue_el[el_num] + "/" + floors_queue + "|");
                        return f;
                    }
                    if (temp_queue.includes(f) && load <= 0.6) {
                        if (!floors_queue.includes(to_floor)) {
                            floors_queue.push(to_floor);
                        }
                        console.log(el_num + "|stop_found|UP," + to_floor + "," + f + " " + floors_queue_el[el_num] + "/" + floors_queue + "|");
                        return f;
                    }
                }
            } else {
                //DOWN
                for (let f = floor - 1; f > to_floor; f--) {
                    if (temp_queue_el.includes(f)) {
                        if (!temp_queue_el.includes(to_floor)) {
                            floors_queue_el[el_num].push(to_floor);
                        }
                        console.log(el_num + "|stop_found_el|DOWN," + to_floor + "," + f + " " + floors_queue_el[el_num] + "/" + floors_queue + "|");
                        return f;
                    }
                    if (temp_queue.includes(f) && load <= 0.6) {
                        if (!floors_queue.includes(to_floor)) {
                            floors_queue.push(to_floor);
                        }
                        console.log(el_num + "|stop_found|DOWN," + to_floor + "," + f + " " + floors_queue_el[el_num] + "/" + floors_queue + "|");
                        return f;
                    }
                }
            }
            return to_floor;
        }

        function get_next_floor(el_num) {
            var next_floor, is_next_floor_from_elevator = false;
            var floor = elevators[el_num].currentFloor();
            var load = elevators[el_num].loadFactor();

            var next_floor = floors_queue_el[el_num].shift();
            console.log(el_num + "|next_floor|from elevator queue:" + next_floor + "|");
            if (next_floor == floor) {
                console.log(el_num + "|same floor|" + floor + "|");
                next_floor = floors_queue_el[el_num].shift();
                console.log(el_num + "|next_floor|from elevator queue:" + next_floor + ' queue:' + floors_queue_el[el_num] + "|");
            }
            if (next_floor >= 0) {
                is_next_floor_from_elevator = true;
            } else {
                next_floor = floors_queue.shift();
                console.log(el_num + "|next_floor|from outside queue:" + next_floor + ' queue:' + floors_queue + "|");
                if (next_floor == floor) {
                    console.log(el_num + "|same floor|" + floor + "|");
                    next_floor = floors_queue.shift();
                    console.log(el_num + "|next_floor|from outside queue:" + next_floor + "|");
                }
                if (next_floor >= 0) {

                } else {
                    console.log(el_num + "|next_floor|NO|");
                    next_floor = null;
                }
            }
            if (next_floor >= 0 && next_floor !== floor) {
                console.log(el_num + "|next_floor final|a:" + next_floor + ", " + floors_queue_el[el_num] + '/' + floors_queue + " (" + floor + ")" + "|");
                next_floor = check_stop_btw(el_num, next_floor, is_next_floor_from_elevator);
                console.log(el_num + "|next_floor final|b:" + next_floor + ", " + floors_queue_el[el_num] + '/' + floors_queue + " (" + floor + ")" + "|");
                remove_floor_from_queue(el_num, next_floor);
                console.log(el_num + "|after remove_floor_from_queue|" + next_floor + ", " + floors_queue_el[el_num] + '/' + floors_queue + " (" + floor + ")" + "|");
                return next_floor;
            }

            return null;
        }

        for (let el_num = 0; el_num < elevators.length; el_num++) {
            floors_queue_el[el_num] = [];

            elevators[el_num].on("floor_button_pressed", function(floorNum) {
                console.log(el_num + "|floor_button_pressed|" + floorNum + "|");
                // if already exists in floors_queue_el?
                if (floors_queue_el[el_num].includes(floorNum)) {
                    console.log(el_num + "|floor_button_pressed|" + floorNum + " already pressed" + "|");
                } else {
                    floors_queue_el[el_num].push(floorNum);
                    if (elevators[el_num].currentFloor() == 0) {
                        floors_queue_el[el_num].sort();
                    }
                }
            });

            elevators[el_num].on("idle", function() {
                var floor = elevators[el_num].currentFloor();
                var load = elevators[el_num].loadFactor();
                console.log(el_num + "|idle event|" + floors_queue_el[el_num] + '/' + floors_queue + " (" + floor + ")" + "|");

                if (load >= min_load[el_num] || floor != 0) {
                    var next_floor = get_next_floor(el_num);
                    if (next_floor >= 0) {
                        elevators[el_num].goToFloor(next_floor, true);
                        console.log(el_num + "|goto floor|" + next_floor + ", " + floors_queue_el[el_num] + '/' + floors_queue + " (" + floor + ")" + "|");
                    }
                } else {
                    console.log(el_num + "|waiting more people|load:" + load + "|");
                }

            });
        }

        for (let floor_i = 0; floor_i < floors.length; floor_i++) {
            floors[floor_i].on("up_button_pressed", function() {
                // if already exists in floors_queue?
                if (floors_queue.includes(floor_i)) {
                    console.log("*" + floor_i + "|up_button_pressed|already pressed, " + "*/" + floors_queue + "|");
                } else {
                    floors_queue.push(floor_i);
                    console.log("*" + floor_i + "|up_button_pressed| " + "*/" + floors_queue + "|");
                }
            })
            floors[floor_i].on("down_button_pressed", function() {
                // if already exists in floors_queue?
                if (floors_queue.includes(floor_i)) {
                    console.log("*" + floor_i + "|down_button_pressed|already pressed," + "*/" + floors_queue + "|");
                } else {
                    floors_queue.push(floor_i);
                    console.log("*" + floor_i + "|down_button_pressed| " + "*/" + floors_queue + "|");
                }
            })
        }

    },

        update: function(dt, elevators, floors) {

        }
}
