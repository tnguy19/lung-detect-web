import numpy as np

#Config:
SPEED_OF_SOUND = 343 #m/s
NUM_MICS = 6

def calibrate():
    #6x6 adjacency array for every mic
    mic_distance_mat = np.array([ #in centimeters
            [0.0, 13.5, 8.0, 15.25, 16.5, 20.5],  # Mic 0
            [13.5, 0.0, 16.0, 8.0, 21.75, 16.75], # Mic 1
            [8.0, 16.0, 0.0, 13.25, 8.5, 15.0],  # Mic 2
            [15.25, 8.0, 13.25, 0.0, 16.0, 8.75], # Mic 3
            [16.5, 21.75, 8.5, 16.0, 0.0, 13.0],  # Mic 4
            [20.5, 16.75, 15.0, 8.75, 13.0, 0.0]  # Mic 5
            #mic 0, mic 1, mic 2, mic 3, mic 4, mic 5
        ])
    mic_time_mat_ms = mic_distance_mat / (SPEED_OF_SOUND / 10)

    #print("=== Theoretical True Time-of-Flight (ms) for a speed of sound =", SPEED_OF_SOUND, "m/s ===")
    #print(np.round(mic_time_mat_ms, 4), "\n")

    artificial_delays = np.array([0.0, 0.3, -0.2, 0.1, 0.0, 0.2])  # example unknowns
    # measured(i,j) = true(i,j) + delta_i + delta_j
    mic_test_result_mat = np.zeros((6,6), dtype=float)
    for i in range(6):
        for j in range(6):
            mic_test_result_mat[i,j] = mic_time_mat_ms[i,j] + (artificial_delays[i] + artificial_delays[j])

    #print("=== Mock Measured Times (ms) [Including unknown artificial offsets] ===")
    #print(np.round(mic_test_result_mat, 4), "\n")

    #!!!!Input callibration test results here!!!:
    mic_test_result_mat = np.array([
            [0.0, 0, 0, 0, 0, 0],  # Mic 0
            [0, 0.0, 0, 0, 0, 0], # Mic 1
            [0, 0, 0.0, 0, 0, 0],  # Mic 2
            [0, 0, 0, 0.0, 0, 0], # Mic 3
            [0, 0, 0, 0, 0.0, 0],  # Mic 4
            [0, 0, 0, 0, 0, 0.0]  # Mic 5
            #mic 0, mic 1, mic 2, mic 3, mic 4, mic 5
        ])

    #print("=== Inputted Test Times (ms) [t_ij = t_true_ij + t_artificial_i + t_artificial_j] ===")
    #print(np.round(mic_test_result_mat, 4), "\n")

    #for test result matrix: t_measured_ij = t_true_ij + artificial_i + artificial_j
    #calculated matrix = t_calculated_ij = t_true_ij
    #therefore, t_measured_ij - t_calculated_ij = artificial_i + artificial_j
    #we can get this accross every row to create a system of equations to solve for artificial_1...5 (artificial_0 will be the refernce set to 0 and all other delays will be relative to this one)

    #System of equations:
    eqns = []
    targets = []
    for i in range(NUM_MICS):
        for j in range(i+1, NUM_MICS):
            lhs = np.zeros(NUM_MICS)
            lhs[i] = 1.0
            lhs[j] = 1.0
            rhs = mic_test_result_mat[i,j] - mic_time_mat_ms[i,j]
            eqns.append(lhs)
            targets.append(rhs)

    # We'll convert eqns -> array, targets -> array, then do a least squares solve
    A = np.stack(eqns, axis=0)          # shape (#eqns, 6)
    b = np.array(targets, dtype=float)  # shape (#eqns,)

    # Solve using np.linalg.lstsq => x. We'll get 6 unknowns in x
    x_sol, residuals, rank, svals = np.linalg.lstsq(A, b, rcond=None)

    #print("\n=== Raw solution from least squares (including delta_0) ===")
    #print(x_sol)

    # Impose delta_0 = 0 by subtracting x_sol[0] from all.
    # That way our final offsets are relative to mic 0's offset.
    delta_0 = x_sol[0]
    final_deltas = x_sol - delta_0

    #print("\n=== Final mic delays (ms), referencing delta_0=0, *negative values means that channel saw the signal sooner than channel 0* ===")
    #for i in range(NUM_MICS):
        #print(f"Mic {i} : {final_deltas[i]:.3f} ms")
    
    # Turn the output array into dict
    deltas_dict = {f"Mic {i}": final_deltas[i] for i in range(NUM_MICS)}

    #print("\n=== Mic Delays as a Dictionary ===")
   # print(deltas_dict) 

    return final_deltas, deltas_dict