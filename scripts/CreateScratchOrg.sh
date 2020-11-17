echo "*** Creating scratch org ..."
sfdx force:org:create -f config/project-scratch-def.json --setdefaultusername --setalias ComponentPackageManagerServerScratch -d 30

echo "*** Pushing metadata to scratch org ..."
sfdx force:source:push

echo "*** Assigning permission set to your user ..."
sfdx force:user:permset:assign --permsetname ComponentPackageManagerServer

echo "*** Generating password for your user ..."
sfdx force:user:password:generate --targetusername ComponentPackageManagerServerScratch

echo "*** Upserting data"
sfdx sfdmu:run --sourceusername csvfile --targetusername ComponentPackageManagerServerScratch -p data

echo "*** Setting up debug mode..."
sfdx force:apex:execute -f scripts/apex/setDebugMode.apex
sfdx force:apex:execute -f scripts/apex/resetAppSettings.apex

echo "*** Setting up debug mode..."
sfdx force:org:open