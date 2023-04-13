#!/bin/bash

tmpDir=$(mktemp -d "tmp.XXXXXXXXXXXX")

mv "$tmpDir" ..
tmpDir=../$tmpDir

mv .git $tmpDir
mv stimuli/masked_datasets $tmpDir
mv stimuli/unmasked_datasets $tmpDir
mv stimuli/masks $tmpDir
mv stimuli/mask_bubbles $tmpDir
