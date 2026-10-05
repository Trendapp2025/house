"""Convert the official GML2 boundary without geometry repair or ring reassignment."""
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

root = ET.parse(sys.argv[1]).getroot()
ns = {'g': 'http://www.opengis.net/gml', 'm': 'http://mapserver.gis.umn.edu/mapserver'}
features = root.findall('.//m:comune', ns)
if len(features) != 1 or features[0].findtext('m:comune_ist', namespaces=ns) != '001059':
    raise ValueError('Unexpected municipality')
geom = features[0].find('m:msGeometry', ns)
if geom is None:
    raise ValueError('Missing geometry')
polygons = []
for polygon in geom.findall('.//g:Polygon', ns):
    if polygon.attrib.get('srsName', 'EPSG:32632') != 'EPSG:32632':
        raise ValueError('Unexpected CRS')
    rings = []
    for kind in ['outerBoundaryIs', 'innerBoundaryIs']:
        boundaries = polygon.findall(f'g:{kind}', ns)
        if kind == 'outerBoundaryIs' and len(boundaries) != 1:
            raise ValueError('Expected one exterior per polygon')
        for boundary in boundaries:
            element = boundary.find('.//g:coordinates', ns)
            if element is None or not element.text:
                raise ValueError('Missing coordinates')
            rings.append([[float(n) for n in pair.split(',')] for pair in element.text.split()])
    polygons.append(rings)
if not polygons:
    raise ValueError('No polygons')
properties = {e.tag.split('}')[-1]: e.text for e in features[0] if e.tag.startswith('{'+ns['m']+'}') and e.tag.split('}')[-1] != 'msGeometry'}
output = {'type':'FeatureCollection','crs':{'type':'name','properties':{'name':'urn:ogc:def:crs:EPSG::32632'}},'features':[{'type':'Feature','properties':properties,'geometry':{'type':'MultiPolygon','coordinates':polygons}}]}
Path(sys.argv[2]).write_text(json.dumps(output), encoding='utf-8')
