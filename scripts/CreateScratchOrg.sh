echo "*** Creating scratch org ..."
sfdx force:org:create -f config/project-scratch-def.json --setdefaultusername --setalias ComponentManagerScratch -d 30

echo "*** Opening scratch org ..."
#sfdx force:org:open

echo "*** Pushing metadata to scratch org ..."
sfdx force:source:push

echo "*** Assigning permission set to your user ..."
sfdx force:user:permset:assign --permsetname Package_Manager

echo "*** Generating password for your user ..."
sfdx force:user:password:generate --targetusername ComponentManagerScratch

echo "*** Creating data"
sfdx force:data:tree:import -f ./data/export-demo-GPBU_Package__cs.json -u ComponentManagerScratch
