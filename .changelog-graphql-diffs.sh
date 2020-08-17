#!/bin/bash
TAGS=($(git tag -l --sort=-version:refname))
TAGS=("HEAD" "${TAGS[@]}") # add HEAD because latest release isn't tagged yet

GENERATE_FOR_ALL_TAGS=false
TEMP_CHANGELOG_FILE=".changelog.tmp"
TARGET_FILE="CHANGELOG.md"
while [ -n "$1" ]
    do
        case "$1" in
            -a|--all_tags) GENERATE_FOR_ALL_TAGS=true ;;
            -t|--target) TARGET_FILE="$2"; shift ;;
        esac
    shift
done
cp $TARGET_FILE $TEMP_CHANGELOG_FILE # create copy of existing changelog

for ((i = 1; i < ${#TAGS[@]}; ++i)); do
    MARKDOWN=""
    LATEST_TAG=${TAGS[$i-1]}
    PREVIOUS_TAG=${TAGS[$i]}
    CHANGED_FILES="$(git diff --name-only $PREVIOUS_TAG $LATEST_TAG)"
    for FULL_FILENAME in $CHANGED_FILES; do
        FILENAME=$(basename -- "${FULL_FILENAME}")
        EXTENSION="${FILENAME##*.}"

        if [ "$EXTENSION" == "graphql" ]; then
            FILE_CHANGES_FULL="$(git diff -U1000 $PREVIOUS_TAG $LATEST_TAG -- $FULL_FILENAME)"
            FILE_CHANGES_META="$(head -n 5 <<< "$FILE_CHANGES_FULL")"

            if [[ $FILE_CHANGES_META == *"new file"* || $FILE_CHANGES_META == *"deleted file"* ]]; then # if file created/deleted we don't need use graphql-inspector
                FILE_CHANGES="$(tail +7 <<< "$FILE_CHANGES_FULL")"
                
                if [[ $FILE_CHANGES_META == *"new file"* ]]; then
                    MARKDOWN+="<details> <summary>$FULL_FILENAME: created new schema </summary>"
                elif [[ $FILE_CHANGES_META == *"deleted file"* ]]; then
                    MARKDOWN+="<details> <summary>$FULL_FILENAME: removed schema </summary>"
                fi
            else
                FILE_CHANGES="$(tail +6 <<< "$FILE_CHANGES_FULL")"
                SCHEMA_CHANGES="$(graphql-inspector diff \
                                    git:$PREVIOUS_TAG:$FULL_FILENAME git:$LATEST_TAG:$FULL_FILENAME | 
                                    tail +4)" # gets graphql-inspector diff between two tags for current file. 4 first lines skipped because of meta
                
                ERRORS_MESSAGE="$(sed -n '/^\[error\].*$/p'  <<< "$SCHEMA_CHANGES" | 
                                sed -e 's/\[[^][]*\]\s*//g')" # gets lines that contain "[error]" then removes "[error]" from them

                MESSAGES_WITHOUT_ERRORS="$(sed '/^\[error\].*$/d' <<< "$SCHEMA_CHANGES")" # gets lines that doesn't contain "[error]"

                SCHEMA_CHANGES_MESSAGE="$(sed -e 's/\[[^][]*\]\s*//g' <<< "$MESSAGES_WITHOUT_ERRORS" | # removes any content in brackets
                                        sed -e 'G')" # adds additional line breaks

                MARKDOWN+="<details> <summary>$FULL_FILENAME: $ERRORS_MESSAGE</summary>"
            fi
            MARKDOWN+="\n\n"
            MARKDOWN+='``` diff'
            MARKDOWN+="\n"
            MARKDOWN+="$FILE_CHANGES"
            MARKDOWN+='\n```'
            MARKDOWN+='\n\n'

            MARKDOWN+="$SCHEMA_CHANGES_MESSAGE"
            MARKDOWN+='\n'
            MARKDOWN+="</details>"
            MARKDOWN+='\n\n'
        fi
    done

    if [ "$MARKDOWN" != "" ]; then
        ESCAPED_PREVIOUS_VERSION="$(cut -c 2- <<< ${PREVIOUS_TAG//./\\.})" # changes "v1.0.0" to "1\.0\.0"
        SEARCH_PATTERN="/.*(\[| ).*$ESCAPED_PREVIOUS_VERSION(\]| ).*/" # search escaped version value in brackets or space arounded. "[v1.0.0]", "[1.0.0]" and " 1.0.0 " mathes
        awk -v var="$MARKDOWN" \
            -v ESCAPED_PREVIOUS_VERSION="$ESCAPED_PREVIOUS_VERSION" \
            '!found && '"$SEARCH_PATTERN"'{printf var; found=1} 1' \
            $TEMP_CHANGELOG_FILE  \
            > ./output.md && mv ./output.md $TEMP_CHANGELOG_FILE # paste MARKDOWN value before previous tag declaration line, output into new file and replace temporary file with new file
    fi

    if [ $GENERATE_FOR_ALL_TAGS == false ]; then
        break
    fi
done

mv $TEMP_CHANGELOG_FILE $TARGET_FILE # replace target file with fully updated temp file