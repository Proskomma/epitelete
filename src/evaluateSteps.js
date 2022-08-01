import transforms from './transforms';

const verbose = false;

const evaluateSteps = async ({specSteps, inputValues}) => {
    verbose && console.log("** Evaluate **");
    // Find input, output and transforms
    const inputStep = specSteps.filter(s => s.type==="Inputs")[0];
    if (!inputStep) {
        throw new Error(`No Inputs step found in report steps`);
    }
    const outputStep = specSteps.filter(s => s.type==="Outputs")[0];
    if (!outputStep) {
        throw new Error(`No Outputs step found in report steps`);
    }
    const transformSteps = specSteps.filter(s => s.type==="Transform");
    if (transformSteps.length === 0) {
        throw new Error(`No Transform steps found in report steps`);
    }
    const transformInputs = {};
    const transformOutputs = {};
    for (const transformStep of Object.values(transformSteps)) {
        transformInputs[transformStep.id] = {};
        for (const input of transformStep.inputs) {
            transformInputs[transformStep.id][input.name] = null;
        }
        transformOutputs[transformStep.id] = {};
        for (const output of transformStep.outputs) {
            transformOutputs[transformStep.id][output] = null;
        }
    }
    // Copy inputs to transforms
    for (const [inputKey, inputValue] of Object.entries(inputValues)) {
        for (const transformStep of transformSteps) {
            for (const input of transformStep.inputs) {
                if (input.source === `Input ${inputKey}`) {
                    verbose && console.log(`Copying Input ${inputKey} to Transform ${transformStep.id} ${input.name} input`);
                    transformInputs[transformStep.id][input.name] = inputValue;
                }
            }
        }
    }
    // Propagate values between transforms until nothing changes
    let changed = true;
    let nWaitingTransforms = 0;
    while (changed) {
        changed = false;
        for (const transformStep of transformSteps) {
            if (
                Object.values(transformInputs[transformStep.id]).filter(i => !i).length === 0 &&
                Object.values(transformOutputs[transformStep.id]).filter(i => !i).length > 0
            ) {
                verbose && console.log(`Evaluating Transform ${transformStep.id}`);
                try {
                    transformOutputs[transformStep.id] = transforms[transformStep.transformName].code({...transformInputs[transformStep.id]});
                } catch (err) {
                    const errMsg = `Error evaluating Transform ${transformStep.id} (name=${transformStep.name}, type=${typeof transformStep.code}): ${err}`;
                    throw new Error(errMsg);
                }
                for (const consumingTransform of transformSteps) {
                    for (const consumingInput of consumingTransform.inputs) {
                        for (const resolvedOutput of Object.keys(transformOutputs[transformStep.id])) {
                            if (consumingInput.source === `Transform ${transformStep.id} ${resolvedOutput}`) {
                                verbose && console.log(`Copying Transform ${transformStep.id} ${resolvedOutput} output to Transform ${consumingTransform.id} ${consumingInput.name} input`);
                                transformInputs[consumingTransform.id][consumingInput.name] = transformOutputs[transformStep.id][resolvedOutput];
                            }
                        }
                    }
                }
                changed = true;
            }
        }
    }
    if (nWaitingTransforms) {
        throw new Error(`Inputs not satisfied for ${nWaitingTransforms} transform(s)`);
    }
    // Copy to output;
    const outputValues = {};
    for (const output of outputStep.outputs) {
        const transformN = output.source.split(' ')[1];
        verbose && console.log(`Copying Transform ${transformN} ${output.name} to Output ${output.name}`);
        outputValues[output.name] = transformOutputs[transformN][output.name];
    }
    verbose && console.log("****");
    return outputValues;
}

export default evaluateSteps;
