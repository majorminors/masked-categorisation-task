#!/bin/bash

homeDir=$(pwd)

for fldr in *; do

    if [[ $fldr == "rename_folders.sh" ]]; then
        continue
    fi

    cd $homeDir/$fldr
    for subfldr in *; do

        cd $homeDir/$fldr/$subfldr
        ranges=(*)
        IFS=$'\n' sortedRanges=($(sort <<<"${ranges[*]}"))
        unset IFS
        count=1
        for (( idx=${#sortedRanges[@]}-1 ; idx>=0 ; idx-- )) ; do

            echo "${sortedRanges[idx]}"
            mkdir $count
            cp ${sortedRanges[idx]}/100/* $count/
            count=$((count+1))
            if [[ $count == 6 ]]; then
                break
            fi

        done
    cd $homeDir/$fldr

    done
    cd $homeDir

done
